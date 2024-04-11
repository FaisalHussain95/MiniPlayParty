import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'room_user_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.string('room_id').references('id').inTable('rooms').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
