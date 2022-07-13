import { schema, validator } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Pokedex from '../../../utils/pokeapi'
import { flattenDeep } from 'lodash'

import { dgToKg, dmTom, getDamagesInfos } from '../../../utils/pokedex'
import {
  Pokemon,
  PokemonSpecies,
  Type,
  PokemonColor,
  EggGroup,
  Stat,
  EvolutionChain,
  PokemonForm,
  Chain,
  EvolutionTrigger,
  Item,
  Location,
} from '../../../utils/types'
const P = new Pokedex()

const SPRITE_URL =
  'https://github.com/PokeAPI/sprites/blob/master/sprites/pokemon/other/official-artwork'

export default class PokemonsController {
  public async getPokemons({ request, response }: HttpContextContract) {
    const language = request.header('accept-language')

    const querySchema = schema.create({
      limit: schema.number(),
      offset: schema.number(),
    })

    try {
      const payload = await request.validate({
        schema: querySchema,
        reporter: validator.reporters.api,
      })

      const { offset, limit } = payload

      const allPokemons = await P.getPokemonsList({ offset, limit })

      const pokemonsPromises = allPokemons.results.map(async (p) => {
        // Récupération du pokémon
        const pokemon = (await P.getPokemonByName(p.name)) as Pokemon

        // Récupération de l'espèce
        const specie = (await P.getPokemonSpeciesByName(p.name)) as PokemonSpecies

        // Récupération des types en français
        const pokemonTypes = pokemon.types.map((t) => t.type.name)
        const types = (await Promise.all(pokemonTypes.map((t) => P.getTypeByName(t)))) as Type[]
        const typesFr = types
          .map((t) => t.names.filter((name) => name.language.name === language)[0].name)
          .map((t) => t.toLowerCase())

        // Récupération des couleurs en français
        const pokemonColor = specie.color.name
        const colors = (await P.getPokemonColorByName(pokemonColor)) as PokemonColor
        const colorFr = colors.names
          .filter((name) => name.language.name === language)[0]
          .name.toLowerCase()

        return {
          name: specie.names.filter((pokeAPIName) => pokeAPIName.language.name === language)[0]
            .name,
          types: typesFr,
          color: {
            name: colorFr,
            id: specie.color.name,
          },
          spriteUrl: `${SPRITE_URL}/${pokemon.id}.png?raw=true`,
          number: '#' + pokemon.id.toString().padStart(3, '0'),
          id: pokemon.id,
        }
      })

      const pokemons = await Promise.all(pokemonsPromises)

      return pokemons
    } catch (err) {
      response.badRequest(err)
    }
  }

  public async getPokemon({ params, request }: HttpContextContract) {
    const language = request.header('accept-language')
    const id = params.id

    // Récupération du pokémon
    const pokemon = (await P.getPokemonByName(id)) as Pokemon

    // Récupération de l'espèce
    const specie = (await P.getPokemonSpeciesByName(id)) as PokemonSpecies

    // Récupération du nom en français
    const pokeName = specie.names.filter((pokeAPIName) => pokeAPIName.language.name === language)[0]
      .name

    // Récupération des types en français
    const pokemonTypes = pokemon.types.map((t) => t.type.name)
    const types = (await Promise.all(pokemonTypes.map((t) => P.getTypeByName(t)))) as Type[]
    const typesFr = types
      .map((t) => t.names.filter((name) => name.language.name === language)[0].name)
      .map((t) => t.toLowerCase())

    // Récupération des couleurs en français
    const pokemonColor = specie.color.name
    const colors = (await P.getPokemonColorByName(pokemonColor)) as PokemonColor
    const colorFr = colors.names
      .filter((name) => name.language.name === language)[0]
      .name.toLowerCase()

    // Récupération du génôme en français
    const genus = specie.genera.filter((f) => f.language.name === language)[0].genus

    // SECTION ABOUT
    // Récupération du texte pokedex
    const flavorText = specie.flavor_text_entries
      .find((te) => te.language.name === language)
      ?.flavor_text.replace(/\n/g, ' ')

    // Récupération taille & poids
    const height = dmTom(pokemon.height)
    const weight = dgToKg(pokemon.weight)

    // Récupération des infos d'élevage
    const genderRate = {
      male: 100 - (specie.gender_rate / 8) * 100 + '%',
      female: (specie.gender_rate / 8) * 100 + '%',
    }
    const hatchCount = 255 * (specie.hatch_counter + 1)
    const eggGroups = await Promise.all(
      specie.egg_groups.map(async (eggGroup) => {
        const group = (await P.getEggGroupByName(eggGroup.name)) as EggGroup
        return group.names.filter((n) => n.language.name === language)[0].name
      })
    )

    // SECTION Stats
    const pokemonStats = await Promise.all(
      pokemon.stats.map(async (stat) => {
        const s = (await P.getStatByName(stat.stat.name)) as Stat
        return {
          name: s.names.filter((n) => n.language.name === language)[0].name,
          value: stat.base_stat,
        }
      })
    )
    const damagesInfos = getDamagesInfos(types)

    // SECTION Evolutions
    // Evolutions classiques
    const evolutionChains = (await P.getEvolutionChainById(
      +specie.evolution_chain.url.split('/').slice(-2)[0]
    )) as EvolutionChain

    const chains = await getEvolutionDetails(
      language ?? 'fr',
      evolutionChains.chain.species.name,
      evolutionChains.chain.evolves_to
    )

    // Evolutions spéciales
    const varietties = await Promise.all(
      specie.varieties
        .filter((v) => v.is_default === false)
        .filter((v) => v.pokemon.name.indexOf('-starter') === -1)
        .map(async (variety) => {
          const v = (await P.getPokemonByName(variety.pokemon.name)) as Pokemon
          const form = (await P.getPokemonFormByName(variety.pokemon.name)) as PokemonForm

          // On tente de trouver le nom français
          let name = form.names.filter((f) => f.language.name === language)[0]?.name

          // Si pas de nom, on se rabat sur l'anglais
          if (!name) {
            name = form.names.filter((f) => f.language.name === 'en')[0].name
          }

          // Si jamais, pour les pikach et leurs casquettes...
          if (language === 'fr' && name.indexOf(' Cap ') !== -1) {
            const type = name.split(' ')[0]
            const REGION = ['Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola']
            if (REGION.indexOf(type) !== -1) {
              name = `${pokeName} Casquette de ${type}`
            }
            switch (type) {
              case 'Partner':
                name = `${pokeName} Casquette Partenaire`
                break
              case 'Original':
                name = `${pokeName} Casquette Originale`
                break
              case 'World':
                name = `${pokeName} Casquette Monde`
                break

              default:
                break
            }
          }

          // Gestion des "Gigamax"
          if (language === 'fr' && name.indexOf('Gigantamax') !== -1) {
            name = `${pokeName} Gigamax`
          }
          return {
            from: {
              name: pokeName,
              spriteUrl: `${SPRITE_URL}/${specie.id}.png?raw=true`,
            },
            to: {
              name,
              spriteUrl: `${SPRITE_URL}/${v.id}.png?raw=true`,
            },
          }
        })
    )
    return {
      pokemon: {
        name: pokeName,
        types: typesFr,
        color: {
          name: colorFr,
          id: specie.color.name,
        },
        spriteUrl: `${SPRITE_URL}/${pokemon.id}.png?raw=true`,
        number: '#' + pokemon.id.toString().padStart(3, '0'),
        id: pokemon.id,
        genus,
      },
      about: {
        flavorText,
        height,
        weight,
        breed: {
          genderRate,
          hatchCount,
          eggGroups,
        },
      },
      stats: {
        values: pokemonStats,
        damagesInfos,
      },
      chains: {
        regular: flattenDeep(chains),
        varietties,
      },
    }
  }
}

async function getEvolutionDetails(language: string, from: string, evolves_to: Chain[]) {
  return await Promise.all(
    evolves_to.map(async (evolution) => {
      const specieFrom = (await P.getPokemonSpeciesByName(from)) as PokemonSpecies
      const specieTo = (await P.getPokemonSpeciesByName(evolution.species.name)) as PokemonSpecies
      const detail = await Promise.all(
        evolution.evolution_details.map(async (evolutionDetail) => {
          // Ce qui trigger l'évolution :
          const evolutionTrigger = (await P.getEvolutionTriggerByName(
            evolutionDetail.trigger.name
          )) as EvolutionTrigger
          const evolutionTriggerNameFr = evolutionTrigger.names.filter(
            (n) => n.language.name === language
          )[0].name

          // Si c'est un item : le nom fr
          let evolutionItemFr: string | null = null
          if (evolutionDetail.item) {
            const evolutionItem = (await P.getItemByName(evolutionDetail.item.name)) as Item
            evolutionItemFr = evolutionItem.names.filter((ev) => ev.language.name === language)[0]
              .name
          }

          // Si c'est un move : le nom fr
          let knownMoveTypeFr: string | null = null
          if (evolutionDetail.known_move_type) {
            const knownMoveType = (await P.getTypeByName(
              evolutionDetail.known_move_type.name
            )) as Type
            knownMoveTypeFr = knownMoveType.names.filter((ev) => ev.language.name === language)[0]
              .name
          }

          // Si c'est une localisation
          let locationFr: string | null = null
          if (evolutionDetail.location) {
            const locations = (await P.getLocationByName(evolutionDetail.location.name)) as Location
            locationFr = locations.names.filter((ev) => ev.language.name === language)[0].name
          }

          return {
            ...evolutionDetail,
            trigger: evolutionTriggerNameFr,
            item: evolutionItemFr,
            known_move_type: knownMoveTypeFr,
            location: locationFr,
          }
        })
      )

      let chains = await getEvolutionDetails(language, evolution.species.name, evolution.evolves_to)

      return [
        {
          from: {
            name: specieFrom.names.filter((p) => p.language.name === language)[0].name,
            spriteUrl: `${SPRITE_URL}/${specieFrom.id}.png?raw=true`,
            id: specieFrom.id,
          },
          to: {
            name: specieTo.names.filter((p) => p.language.name === language)[0].name,
            spriteUrl: `${SPRITE_URL}/${specieTo.id}.png?raw=true`,
            id: specieTo.id,
          },
          detail,
        },
        ...chains,
      ]
    })
  )
}
