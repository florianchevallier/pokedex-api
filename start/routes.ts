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

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/pokemons', 'PokemonsController.list')
  Route.get('/pokemons/:id', 'PokemonsController.get')
  Route.get('/pokemons/:id/about', 'PokemonsController.about')
  Route.get('/pokemons/:id/chains', 'PokemonsController.chains')
  Route.get('/pokemons/:id/stats', 'PokemonsController.stats')
  Route.get('/pokemons/:id/moves', 'PokemonsController.moves')
}).prefix('api')
