import redis from '@adonisjs/redis/services/main'

class CacheService {
  async exists(...keys: string[]) {
    return await redis.exists(keys)
  }

  async get(key: string) {
    const value = await redis.get(key)

    if (!value) {
      return Promise.reject('Value not found')
    }

    // Try to parse JSON
    try {
      return JSON.parse(value)
    } catch {
      return Promise.reject('Failed to parse value')
    }
  }

  async set(key: string, value: any) {
    // Try to stringify JSON
    try {
      const stringifiedValue = JSON.stringify(value)
      await redis.set(key, stringifiedValue)
    } catch {
      // dont save if failed
      return Promise.reject('Failed to stringify value')
    }
  }

  async del(...keys: string[]) {
    await redis.del(keys)
  }

  async flushdb() {
    await redis.flushdb()
  }
}

const cache = new CacheService()
export default cache
