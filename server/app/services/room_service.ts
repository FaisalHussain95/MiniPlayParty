import User from '#models/user'
import Room from '#models/room'
import { roomSchema, updateRoomSchema, handleRoomRequestSchema } from '#validators/room'
import { Infer } from '@vinejs/vine/types'
import { customAlphabet } from 'nanoid'
import { errors as authErrors } from '@adonisjs/auth'
import {
  clearUserRoomsCache,
  clearRoomCache,
  getRoomCache,
  setRoomCache,
  getUserRoomsCache,
  setUserRoomsCache,
} from '#services/room_cache_service'

export const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const roomIdGenerator = customAlphabet(ID_ALPHABET, 15)

export type APIMessage = {
  message: string
}

export type ResponseType = {
  data: Room | Room[] | APIMessage | null
  cacheHit?: boolean
}

export const cacheDataService = (
  data: Pick<ResponseType, 'data'>['data'],
  cacheHit?: Pick<ResponseType, 'cacheHit'>['cacheHit']
): ResponseType => {
  return {
    cacheHit,
    data,
  }
}

export const createRoom = async (user: User, payload: Infer<typeof roomSchema>) => {
  const room = new Room()
  room.id = roomIdGenerator()
  room.name = payload.name
  if (payload.avatar) room.avatar = payload.avatar
  await room.save()

  // Current user is the admin of the room
  await room.related('users').attach({
    [user.id]: { admin: true },
  })

  // Flush user rooms cache and room cache just in case
  clearUserRoomsCache([user.id])
  await clearRoomCache(room.id)

  return cacheDataService(room, false)
}

export const updateRoom = async (
  roomId: string,
  user: User,
  payload: Infer<typeof updateRoomSchema>
) => {
  const room = await Room.query().preload('users').where('id', roomId).firstOrFail()
  simpleAuthAdminCheck(user, room)

  room.name = payload.name
  if (payload.avatar) room.avatar = payload.avatar
  await room.save()

  // Update the users in the room
  await room.related('users').sync(
    payload.userIds.reduce((acc: { [key: number]: { admin: boolean } }, userId) => {
      acc[userId] = { admin: payload.adminIds.includes(userId) }
      return acc
    }, {})
  )

  // Flush user rooms cache and room cache
  await clearUserRoomsCache([...payload.userIds, ...room.users.map((u) => u.id)])
  await clearRoomCache(roomId)

  return await getRoom(roomId, user)
}

export const deleteRoom = async (room: Room) => {
  await room.delete()

  // Flush user rooms cache
  await clearUserRoomsCache(room.users.map((u) => u.id))
  await clearRoomCache(room.id)

  return cacheDataService({
    message: 'Room deleted',
  })
}

export const getRoomFromDb = async (id: string) => {
  try {
    return await Room.query().preload('users').preload('requests').where('id', id).firstOrFail()
  } catch (error) {
    throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
      guardDriverName: 'access_tokens',
    })
  }
}

export const getRoom = async (id: string, user?: User) => {
  let room: Room
  let cacheHit = false

  try {
    room = await getRoomCache(id)
    cacheHit = true
  } catch (error) {
    cacheHit = false
    room = await getRoomFromDb(id)
    await setRoomCache(id, room)
  }

  if (user) {
    const isUser = room.users.find((u) => u.id === user.id)

    if (!isUser) {
      throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'access_tokens',
      })
    }
  }

  return cacheDataService(room, cacheHit)
}

export const joinRequest = async (user: User, roomId: string) => {
  let room: Room | null
  let cacheHit: boolean | undefined

  try {
    const data = await getRoom(roomId)
    room = data.data as Room
    cacheHit = data.cacheHit
  } catch (error) {
    // Room not found
    room = null
  }

  if (room) {
    const userExist = room.users.find((u) => u.id === user.id)
    const requestExist = room.requests.find((u) => u.id === user.id)

    if (!userExist && !requestExist) {
      // room can be parsed from cache and is not a lucid model
      if (!room.related) {
        room = await getRoomFromDb(roomId)
      }

      await room.related('requests').attach([user.id])

      // Flush room cache
      await clearRoomCache(roomId).catch(() => null)
    }
  }

  return cacheDataService(room, cacheHit)
}

export const leaveRoom = async (user: User, roomId: string) => {
  let room: Room | null
  let cacheHit: boolean | undefined

  try {
    const data = await getRoom(roomId)
    room = data.data as Room
    cacheHit = data.cacheHit
  } catch (error) {
    // Room not found
    room = null
  }

  if (room) {
    const userExist = room.users.find((u) => u.id === user.id)

    if (userExist) {
      // room can be parsed from cache and is not a lucid model
      if (!room.related) {
        room = await getRoomFromDb(roomId)
      }

      await room.related('users').detach([user.id])

      // Flush room cache
      await clearRoomCache(roomId).catch(() => null)
    }
  }

  return cacheDataService(room, cacheHit)
}

export const handleUser = async (
  user: User,
  roomId: string,
  payload: Infer<typeof handleRoomRequestSchema>
) => {
  let room: Room | null
  let cacheHit: boolean | undefined

  try {
    const data = await getRoom(roomId)
    room = data.data as Room
    cacheHit = data.cacheHit

    simpleAuthAdminCheck(user, room)

    const toAttach = payload.accept ?? []
    const toDetach = payload.reject ?? []

    // room can be parsed from cache and is not a lucid model
    if (!room.related) {
      room = await getRoomFromDb(roomId)
    }

    await room.related('users').attach(toAttach)
    await room.related('requests').detach(toDetach)

    // Flush room cache
    await clearRoomCache(roomId).catch(() => null)
  } catch (error) {
    // Room not found
  }

  return cacheDataService(
    {
      message: 'Users handled',
    },
    cacheHit
  )
}

export const getRoomsOfUser = async (user: User) => {
  let rooms: Room[]
  let cacheHit: boolean | undefined

  try {
    rooms = (await getUserRoomsCache(user.id)) as Room[]
    cacheHit = true
  } catch (error) {
    const roomsDb = await Room.query()
      .withScopes((scopes) => scopes.forUser(user))
      .preload('users')
      .preload('requests')

    await setUserRoomsCache(user.id, roomsDb)

    rooms = roomsDb
    cacheHit = false
  }

  return cacheDataService(rooms, cacheHit)
}

export const simpleAuthAdminCheck = (user: User, room: Room) => {
  const loggedUserIsAdmin = room.users.find((u) => u.id === user.id && u.isAdmin)

  if (!loggedUserIsAdmin) {
    throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
      guardDriverName: 'access_tokens',
    })
  }
}
