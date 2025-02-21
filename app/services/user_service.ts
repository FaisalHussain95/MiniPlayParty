import User from '#models/user'
import { userSchema, updateUserSchema } from '#validators/user'
import { Infer } from '@vinejs/vine/types'

export const createUser = async (payload: Infer<typeof userSchema>) => {
  const user = new User()
  user.username = payload.username
  user.password = payload.password
  user.name = payload.name
  user.avatar = payload.avatar ?? null
  await user.save()

  const token = await User.accessTokens.create(user)
  return token
}

export const updateUser = async (user: User, payload: Infer<typeof updateUserSchema>) => {
  user.name = payload.name
  user.avatar = payload.avatar ?? null
  if (payload.password) user.password = payload.password
  await user.save()
}

export const deleteUser = async (user: User) => {
  await user.delete()
}
