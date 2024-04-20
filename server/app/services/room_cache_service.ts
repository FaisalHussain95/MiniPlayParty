import redis from '@adonisjs/redis/services/main'

export const userRoomsCacheId = (id: number) => `user:${id}:rooms`
export const roomCacheId = (id: string) => `room:${id}`

export const clearUserRoomsCache = async (ids: number[]) => {
  try {
    await redis.del(ids.map(userRoomsCacheId))
  } catch (error) {
    console.error('Failed to flush user rooms cache', error)
  }
}

export const clearRoomCache = async (id: string) => {
  try {
    await redis.del([roomCacheId(id)])
  } catch (error) {
    console.error('Failed to flush room cache', error)
  }
}

export const getRoomCache = async (id: string) => {
  try {
    const room = await redis.get(roomCacheId(id))

    if (!room) {
      return Promise.reject('Room not found')
    }

    return JSON.parse(room)
  } catch (error) {
    return Promise.reject('Failed to get room cache or parse value')
  }
}

export const setRoomCache = async (id: string, room: any) => {
  try {
    await redis.set(roomCacheId(id), JSON.stringify(room))
  } catch (error) {
    console.error('Failed to set room cache', error)
  }
}
