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
} from '#services/room_cache_service'

export const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const roomIdGenerator = customAlphabet(ID_ALPHABET, 15)

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

  return room
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
  await clearUserRoomsCache(payload.userIds)
  await clearRoomCache(roomId)

  return await getRoom(roomId, user)
}

export const deleteRoom = async (room: Room) => {
  await room.delete()

  // Flush user rooms cache
  await clearUserRoomsCache(room.users.map((u) => u.id))
  await clearRoomCache(room.id)

  return {
    message: 'Room deleted',
  }
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

  try {
    room = await getRoomCache(id)
  } catch (error) {
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

  return room
}

export const joinRequest = async (user: User, roomId: string) => {
  let room: Room | null

  try {
    room = await getRoom(roomId)
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

  return room
}

export const leaveRoom = async (user: User, roomId: string) => {
  let room: Room | null

  try {
    room = await getRoom(roomId)
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

  return {
    message: 'Left room',
  }
}

export const handleUser = async (
  user: User,
  roomId: string,
  payload: Infer<typeof handleRoomRequestSchema>
) => {
  let room: Room | null

  try {
    room = await getRoom(roomId)

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

  return {
    message: 'Users handled',
  }
}

export const getRoomsOfUser = async (user: User) => {
  return await Room.query().withScopes((scopes) => scopes.forUser(user))
}

export const getRequestRoomsOfUser = async (user: User) => {
  return await Room.query().withScopes((scopes) => scopes.requestsForUser(user))
}

export const simpleAuthAdminCheck = (user: User, room: Room) => {
  const loggedUserIsAdmin = room.users.find((u) => u.id === user.id && u.isAdmin)

  if (!loggedUserIsAdmin) {
    throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
      guardDriverName: 'access_tokens',
    })
  }
}
