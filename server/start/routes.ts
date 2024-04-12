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
const RoomsController = () => import('#controllers/rooms_controller')

router.get('/', [StatusController, 'index'])

router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [UsersController, 'store'])
router.put('/auth/user', [UsersController, 'update']).use(middleware.auth())
router.delete('/auth/user', [UsersController, 'destroy']).use(middleware.auth())

router.post('/room', [RoomsController, 'store']).use(middleware.auth())
router.get('/room/:id', [RoomsController, 'show']).use(middleware.auth())
router.put('/room/:id', [RoomsController, 'update']).use(middleware.auth())
router.delete('/room/:id', [RoomsController, 'destroy']).use(middleware.auth())
router.get('/rooms', [RoomsController, 'index']).use(middleware.auth())

router.get('/room/join/:id', [RoomsController, 'joinRequest']).use(middleware.auth())
router.post('/room/handle-user/:id', [RoomsController, 'handleUser']).use(middleware.auth())
