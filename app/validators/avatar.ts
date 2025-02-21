import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

export const validBase64 = (value: string) => {
  const regex =
    /^data:image\/(?:gif|png|jpeg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g

  return regex.test(value)
}

export default vine.createRule(async (value: unknown, _: any, field: FieldContext) => {
  if (!value || typeof value !== 'string' || !validBase64(value)) {
    field.report('The field {{ field }} must be a valid base64 image string', 'base64', field)
  }
})
