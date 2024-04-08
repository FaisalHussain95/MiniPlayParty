import type { HttpContext } from '@adonisjs/core/http'
import { authValidator } from '#validators/auth'
import User from '#models/user'

export default class AuthController {
  async login({ request }: HttpContext) {
    const payload = await request.validateUsing(authValidator)

    const user = await User.verifyCredentials(payload.username, payload.password)

    const token = await User.accessTokens.create(user)

    return token
  }
}
