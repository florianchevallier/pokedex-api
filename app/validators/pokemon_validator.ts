import vine from '@vinejs/vine'

export const listPokemonValidator = vine.compile(
  vine.object({
    limit: vine.number(),
    offset: vine.number(),
  })
)
