import { Type } from 'pokedex-promise-v2'

export function dmTom(dm: number): number {
  return dm / 10
}
export function dgToKg(dg: number): number {
  return dg / 10
}

export function getDamagesInfos(pokemonTypes: Type[]) {
  const sensitivities = pokemonTypes.reduce((prev, curr) => {
    curr.damage_relations.half_damage_from.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 0.5 : 0.5
    })
    curr.damage_relations.double_damage_from.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 2 : 2
    })
    curr.damage_relations.no_damage_from.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 0 : 0
    })
    return prev
  }, {})

  const strengths = pokemonTypes.reduce((prev, curr) => {
    curr.damage_relations.half_damage_to.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 0.5 : 0.5
    })
    curr.damage_relations.double_damage_to.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 2 : 2
    })
    curr.damage_relations.no_damage_to.forEach((t) => {
      prev[t.name] = prev[t.name] ? prev[t.name] * 0 : 0
    })
    return prev
  }, {})

  const finalStrenghts = Object.keys(strengths)
    .filter((k) => strengths[k] === 2)
    .reduce((prev, curr) => {
      prev[curr] = strengths[curr]
      return prev
    }, {})
  const finalSensitivities = Object.keys(sensitivities)
    .filter((k) => sensitivities[k] !== 1 && sensitivities !== 0)
    .reduce((prev, curr) => {
      prev[curr] = sensitivities[curr]
      return prev
    }, {})

  const immunities = Object.keys(sensitivities)
    .filter((k) => sensitivities[k] === 0)
    .reduce((prev, curr) => {
      prev[curr] = sensitivities[curr]
      return prev
    }, {})

  const damagesInfos = {
    strengths: finalStrenghts,
    sensitivities: finalSensitivities,
    immunities,
  }

  return damagesInfos
}

export async function getEvolutionDetails(from: string, evolves_to: IChainLink[]) {
  return await Promise.all(
    evolves_to.map(async (evolution) => {
      const specieFrom = await PokeAPI.PokemonSpecies.resolve(from)
      const specieTo = await PokeAPI.PokemonSpecies.resolve(evolution.species.name)
      let chains = []
      if (evolution.evolves_to.length > 0) {
        chains = await getEvolutionDetails(evolution.species.name, evolution.evolves_to)
      }
      const evolutionDetails = await Promise.all(
        evolution.evolution_details.map(async (evolutionDetail) => {
          const evolutionTrigger = await PokeAPI.EvolutionTrigger.resolve(
            evolutionDetail.trigger.name
          )
          const evolutionTriggerName = evolutionTrigger.names.find(
            (n) => n.language.name === 'fr'
          ).name

          let evolutionItem: IItem
          if (evolutionDetail.item) {
            evolutionItem = await PokeAPI.Item.resolve(evolutionDetail.item.name)
          }

          let knownMoveType: IType
          if (evolutionDetail.known_move_type) {
            knownMoveType = await PokeAPI.Type.resolve(evolutionDetail.known_move_type.name)
          }

          let locations: ILocation
          if (evolutionDetail.location) {
            locations = await PokeAPI.Location.resolve(evolutionDetail.location.name)
          }

          return {
            ...evolutionDetail,
            trigger: {
              ...evolutionDetail.trigger,
              name: evolutionTriggerName,
            },
            item: evolutionItem
              ? {
                ...evolutionDetail.item,
                name: evolutionItem.names.find((n) => n.language.name === 'fr').name,
              }
              : null,
            known_move_type: knownMoveType
              ? {
                ...evolutionDetail.known_move_type,
                name: knownMoveType.names.find((n) => n.language.name === 'fr').name,
              }
              : null,
            location: locations
              ? {
                ...evolutionDetail.location,
                name: locations.names.find((n) => n.language.name === 'fr').name,
              }
              : null,
          }
        })
      )
      return [
        {
          specieFrom,
          specieTo,
          evolutionDetails: evolutionDetails,
        },
        ...chains,
      ]
    })
  )
}
