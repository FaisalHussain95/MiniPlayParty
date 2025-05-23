import cacheService from './cache_service.js'
import Room from '#models/room'

export const userRoomsCacheId = (id: number) => `user:${id}:rooms`
export const roomCacheId = (id: string) => `room:${id}`

const isRoomCacheInvalid = (room: Room) => {
  if (typeof room.id !== 'string' || typeof room.name !== 'string') {
    return true
  }

  return false
}

export const clearUserRoomsCache = async (ids?: number[]) => {
  try {
    if (!ids || ids.length === 0) return

    await cacheService.del(ids.map(userRoomsCacheId))
  } catch (error) {
    console.error('Failed to flush user rooms cache', error)
  }
}

export const setUserRoomsCache = async (id: number, rooms: any) => {
  try {
    await cacheService.set(userRoomsCacheId(id), rooms)
  } catch (error) {
    console.error('Failed to set user rooms cache', error)
  }
}

export const getUserRoomsCache = async (id: number) => {
  try {
    const rooms = await cacheService.get(userRoomsCacheId(id))

    if (!rooms) {
      return Promise.reject('Rooms not found')
    }

    const cacheRooms = JSON.parse(rooms) as Room[]
    if (!Array.isArray(cacheRooms)) {
      return Promise.reject('Invalid cache value')
    } else if (cacheRooms.length !== 0 && isRoomCacheInvalid(cacheRooms[0])) {
      return Promise.reject('Invalid cache value')
    }

    return cacheRooms
  } catch (error) {
    return Promise.reject('Failed to get user rooms cache or parse value')
  }
}

export const clearRoomCache = async (id: string) => {
  try {
    await cacheService.del([roomCacheId(id)])
  } catch (error) {
    console.error('Failed to flush room cache', error)
  }
}

export const getRoomCache = async (id: string) => {
  try {
    const room = await cacheService.get(roomCacheId(id))

    if (!room) {
      return Promise.reject('Room not found')
    }

    const cacheRoom = JSON.parse(room) as Room

    if (isRoomCacheInvalid(cacheRoom)) {
      return Promise.reject('Invalid cache value')
    }

    return cacheRoom
  } catch (error) {
    return Promise.reject('Failed to get room cache or parse value')
  }
}

export const setRoomCache = async (id: string, room: Room) => {
  try {
    await cacheService.set(roomCacheId(id), room)
    await clearUserRoomsCache(room?.users?.map((u: any) => u.id))
  } catch (error) {
    console.error('Failed to set room cache', error)
  }
}
