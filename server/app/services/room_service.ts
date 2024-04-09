import User from '#models/user'
import Room from '#models/room'
import { roomSchema, updateRoomSchema } from '#validators/room'
import { Infer } from '@vinejs/vine/types'
import { customAlphabet } from 'nanoid'

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

  return room
}

export const updateRoom = async (room: Room, payload: Infer<typeof updateRoomSchema>) => {
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
