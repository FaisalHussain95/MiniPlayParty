import vine from '@vinejs/vine'
import { authSchema } from '#validators/auth'
import base64Image from '#validators/avatar'

export const userSchema = vine.object({
  ...authSchema.getProperties(),
  username: authSchema.getProperties().username.unique(async (db, value) => {
    const user = await db.from('users').where('username', value).first()
    return !user
  }),
  name: vine.string().trim(),
  avatar: vine.string().use(base64Image()).optional(),
})

export const updateUserSchema = vine.object({
  ...userSchema.getProperties(),
  username: userSchema.getProperties().username.optional(),
  password: userSchema.getProperties().password.optional(),
})

export const createUserValidator = vine.compile(userSchema)

export const updateUserValidator = vine.compile(updateUserSchema)
