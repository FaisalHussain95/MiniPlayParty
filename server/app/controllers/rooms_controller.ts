import type { HttpContext, Response } from '@adonisjs/core/http'
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
import type { ResponseType } from '#services/room_service'
import Room from '#models/room'

export default class RoomsController {
  /**
   * Display a list of resource
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await getRoomsOfUser(user)

    return this.processRespone(data, response, (rooms) => ({
      rooms,
    }))
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createRoomValidator)
    const room = await createRoom(user, payload)

    return room.data as Room
  }

  /**
   * Show individual record
   */
  async show({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(idParamRoomValidator)
    const data = await getRoom(payload.params.id, user)

    return this.processRespone(data, response)
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

  async handleUser({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(handleRoomRequestValidator)

    await handleUser(user, payload.params.id, payload)

    return this.processRespone(await getRoom(payload.params.id, user), response)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateRoomValidator)

    return this.processRespone(await updateRoom(payload.params.id, user, payload), response)
  }

  /**
   * Delete record
   */
  async destroy({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(idParamRoomValidator)
    const room = await Room.query().preload('users').where('id', payload.params.id).firstOrFail()
    simpleAuthAdminCheck(user, room)

    return this.processRespone(await deleteRoom(room), response)
  }

  processRespone(
    data: ResponseType,
    response: Response,
    dataCb?: (data: Pick<ResponseType, 'data'>['data']) => any
  ) {
    if (data.cacheHit) response.header('X-Cache', 'HIT')
    return dataCb ? dataCb(data.data) : data.data
  }
}
