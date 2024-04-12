import User from '#models/user'
import Room from '#models/room'
import { roomSchema, updateRoomSchema, handleRoomRequestSchema } from '#validators/room'
import { Infer } from '@vinejs/vine/types'
import { customAlphabet } from 'nanoid'
import { errors as authErrors } from '@adonisjs/auth'

export const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const roomIdGenerator = customAlphabet(ID_ALPHABET, 15)

type UserWithAdmin = {
  id: number
  name: string
  avatar: string | null
  username: string
  isAdmin: boolean
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

  return await Room.query().where('id', room.id).preload('users').firstOrFail()
}

export const deleteRoom = async (room: Room) => {
  await room.delete()

  return {
    message: 'Room deleted',
  }
}

export const getRoom = async (id: string, user: User) => {
  const room = await Room.query().preload('users').preload('requests').where('id', id).firstOrFail()
  const isUser = room.users.find((u) => u.id === user.id)

  if (!isUser) {
    throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
      guardDriverName: 'access_tokens',
    })
  }

  const users: UserWithAdmin[] = room.users.map((u) => {
    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      username: u.username,
      isAdmin: u.$extras.pivot_admin,
    }
  })

  // remove users from room
  const roomClean = {
    id: room.id,
    name: room.name,
    avatar: room.avatar,
  }

  return {
    isAdmin: isUser.$extras.pivot_admin,
    users,
    room: roomClean,
  }
}

export const joinRequest = async (user: User, roomId: string) => {
  const room = await Room.query().preload('users').preload('requests').where('id', roomId).first()

  if (room) {
    const userExist = room.users.find((u) => u.id === user.id)
    const requestExist = room.requests.find((u) => u.id === user.id)

    if (!userExist && !requestExist) {
      await room.related('requests').attach([user.id])
    }
  }
}

export const handleUser = async (
  user: User,
  roomId: string,
  payload: Infer<typeof handleRoomRequestSchema>
) => {
  const room = await Room.query()
    .preload('users')
    .preload('requests')
    .where('id', roomId)
    .firstOrFail()
  simpleAuthAdminCheck(user, room)

  const toAttach = payload.accept ?? []
  const toDetach = payload.reject ?? []

  await room.related('users').attach(toAttach)
  await room.related('requests').detach(toDetach)
}

export const getRoomsOfUser = async (user: User) => {
  return await Room.query().withScopes((scopes) => scopes.forUser(user))
}

export const getRequestRoomsOfUser = async (user: User) => {
  return await Room.query().withScopes((scopes) => scopes.requestsForUser(user))
}

export const simpleAuthAdminCheck = (user: User, room: Room) => {
  const loggedUserIsAdmin = room.users.find((u) => u.id === user.id && u.$extras.pivot_admin)

  if (!loggedUserIsAdmin) {
    throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
      guardDriverName: 'access_tokens',
    })
  }
}
