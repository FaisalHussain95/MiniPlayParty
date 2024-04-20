import type { HttpContext } from '@adonisjs/core/http'
import {
  createRoomValidator,
  handleRoomRequestValidator,
  idParamRoomValidator,
  updateRoomValidator,
} from '#validators/room'
import {
  createRoom,
  deleteRoom,
  getRoom,
  getRoomsOfUser,
  handleUser,
  joinRequest,
  leaveRoom,
  simpleAuthAdminCheck,
  updateRoom,
} from '#services/room_service'
import Room from '#models/room'

export default class RoomsController {
  /**
   * Display a list of resource
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const rooms = await getRoomsOfUser(user)

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
    const payload = await request.validateUsing(idParamRoomValidator)
    const room = await getRoom(payload.params.id, user)

    return room
  }

  async leaveRoom({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(idParamRoomValidator)

    // don't matter if it fails
    await leaveRoom(user, payload.params.id)

    return {
      message: 'You have left the group',
    }
  }

  async joinRequest({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(idParamRoomValidator)

    // don't matter if it fails we don't want user to know if the given id really exists
    await joinRequest(user, payload.params.id)

    return {
      message: 'Request sent',
    }
  }

  async handleUser({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(handleRoomRequestValidator)

    await handleUser(user, payload.params.id, payload)

    return await getRoom(payload.params.id, user)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateRoomValidator)

    return await updateRoom(payload.params.id, user, payload)
  }

  /**
   * Delete record
   */
  async destroy({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(idParamRoomValidator)
    const room = await Room.query().preload('users').where('id', payload.params.id).firstOrFail()
    simpleAuthAdminCheck(user, room)

    return await deleteRoom(room)
  }
}
