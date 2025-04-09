import cache from '@adonisjs/cache/services/main'

class CacheService {
  async exists(...keys: string[]) {
    for (const key of keys) {
      if (!(await cache.has({ key }))) {
        return false
      }
    }
    return true
  }

  async get(key: string) {
    const value = await cache.get({ key })

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
      await cache.set({ key, value: stringifiedValue, ttl: '1h' })
    } catch {
      // dont save if failed
      return Promise.reject('Failed to stringify value')
    }
  }

  async del(keys: string[]) {
    await cache.deleteMany({ keys })
  }

  async flushdb() {
    await cache.clear()
  }
}

const cacheService = new CacheService()
export default cacheService
