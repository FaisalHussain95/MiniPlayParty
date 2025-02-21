import vine from '@vinejs/vine'

export const authSchema = vine.object({
  username: vine
    .string()
    .minLength(3)
    .maxLength(30)
    .regex(/^[a-zA-Z0-9]+$/),
  password: vine.string().minLength(6).maxLength(200),
})

export const authValidator = vine.compile(authSchema)
