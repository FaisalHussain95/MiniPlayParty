import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator, updateUserValidator } from '#validators/user'
import { createUser, updateUser, deleteUser } from '#services/user_service'

export default class UsersController {
  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    return createUser(payload)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateUserValidator)
    await updateUser(user, payload)
    return user.refresh()
  }

  /**
   * Delete record
   */
  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await deleteUser(user)

    return {
      message: 'User deleted',
    }
  }
}
