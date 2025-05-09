import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbSLLCa = env.get('DB_SSL_CA')

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl:
          env.get('DB_SSL') === 'true'
            ? {
                rejectUnauthorized: true,
                ...(dbSLLCa ? { ca: Buffer.from(dbSLLCa, 'base64').toString('ascii') } : {}),
              }
            : false,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
