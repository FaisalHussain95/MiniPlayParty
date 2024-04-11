import vine from '@vinejs/vine'

export const roomSchema = vine.object({
  name: vine.string().trim(),
  avatar: vine.string().optional(),
})

export const updateRoomSchema = vine.object({
  ...roomSchema.getProperties(),
  userIds: vine.array(vine.number()).minLength(1),
  adminIds: vine.array(vine.number()).minLength(1),
})

export const handleRoomRequestSchema = vine.object({
  accept: vine.array(vine.number()).nullable().optional(),
  reject: vine.array(vine.number()).nullable().optional(),
})

export const roomIdSchema = vine.object({
  id: vine.string().regex(/^[a-zA-Z0-9]{15}$/),
})

export const createRoomValidator = vine.compile(roomSchema)

export const updateRoomValidator = vine.compile(
  vine.object({
    ...updateRoomSchema.getProperties(),
    params: roomIdSchema,
  })
)

export const idParamRoomValidator = vine.compile(
  vine.object({
    params: roomIdSchema,
  })
)

export const handleRoomRequestValidator = vine.compile(
  vine.object({
    ...handleRoomRequestSchema.getProperties(),
    params: roomIdSchema,
  })
)
