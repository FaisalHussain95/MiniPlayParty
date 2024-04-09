import type { HttpContext } from '@adonisjs/core/http'
import { createRoomValidator, deleteRoomValidator, updateRoomValidator } from '#validators/room'
import { createRoom, deleteRoom, updateRoom } from '#services/room_service'
import User from '#models/user'
import Room from '#models/room'
import { errors as authErrors } from '@adonisjs/auth'

export default class RoomsController {
  /**
   * Display a list of resource
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const rooms = await Room.query()
      .preload('users')
      .withScopes((scopes) => scopes.forUser(user))

    return {
      rooms,
    }
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createRoomValidator)
    const room = await createRoom(user, payload)

    return room
  }

  /**
   * Show individual record
   */
  async show({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(deleteRoomValidator)
    const room = await Room.query().preload('users').where('id', payload.params.id).firstOrFail()
    const isUser = room.users.find((u) => u.id === user.id)

    if (!isUser) {
      throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'access_tokens',
      })
    }

    return room
  }

  static simpleAuthAdminCheck(user: User, room: Room) {
    const loggedUserIsAdmin = room.users.find((u) => u.id === user.id && u.$extras.pivot_admin)

    if (!loggedUserIsAdmin) {
      throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'access_tokens',
      })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateRoomValidator)
    const room = await Room.query().preload('users').where('id', payload.params.id).firstOrFail()
    RoomsController.simpleAuthAdminCheck(user, room)

    return await updateRoom(room, payload)
  }

  /**
   * Delete record
   */
  async destroy({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(deleteRoomValidator)
    const room = await Room.query().preload('users').where('id', payload.params.id).firstOrFail()
    RoomsController.simpleAuthAdminCheck(user, room)

    return await deleteRoom(room)
  }
}
