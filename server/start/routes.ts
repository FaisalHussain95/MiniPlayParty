/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const StatusController = () => import('#controllers/status_controller')
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')

router.get('/', [StatusController, 'index'])

router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [UsersController, 'store'])
router.put('/auth/user', [UsersController, 'update']).use(
  middleware.auth({
    guards: ['api'],
  })
)
router.delete('/auth/user', [UsersController, 'destroy']).use(
  middleware.auth({
    guards: ['api'],
  })
)
