/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import router from '@adonisjs/core/services/router'
const PokemonsController = () => import('#controllers/pokemons_controller')

router
  .group(() => {
    router.get('/pokemons', [PokemonsController, 'list'])
    router.get('/pokemons/:id', [PokemonsController, 'get'])
    router.get('/pokemons/:id/about', [PokemonsController, 'about'])
    router.get('/pokemons/:id/chains', [PokemonsController, 'chains'])
    router.get('/pokemons/:id/stats', [PokemonsController, 'stats'])
    router.get('/pokemons/:id/moves', [PokemonsController, 'moves'])
  })
  .prefix('api')
