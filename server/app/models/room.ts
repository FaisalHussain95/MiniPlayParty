import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, scope } from '@adonisjs/lucid/orm'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

export default class Room extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare avatar: string | null

  @manyToMany(() => User, {
    pivotTable: 'room_user',
    pivotColumns: ['admin'],
    onQuery: (query) => {
      if (query.isRelatedPreloadQuery) {
        query.select('id', 'name', 'avatar', 'username')
      }
    },
  })
  declare users: ManyToMany<typeof User>
  static forUser = scope((query, user: User) => {
    const subQuery = db.from('room_user').select('room_id').where('room_user.user_id', user.id)

    query.whereIn('id', subQuery)
  })

  @manyToMany(() => User, {
    pivotTable: 'room_user_requests',
    onQuery: (query) => {
      if (query.isRelatedPreloadQuery) {
        query.select('id', 'name', 'avatar', 'username')
      }
    },
  })
  declare requests: ManyToMany<typeof User>
  static requestsForUser = scope((query, user: User) => {
    const subQuery = db
      .from('room_user_requests')
      .select('room_id')
      .where('room_user_requests.user_id', user.id)

    query.whereIn('id', subQuery)
  })

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
