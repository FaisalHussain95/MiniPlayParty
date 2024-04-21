import { test } from '@japa/runner'
import User from '#models/user'

test.group('User Test Suite', () => {
  test('Invalid username', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'Test User+',
      password: 'password',
      name: 'Test User',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(422)
  })
  test('Invalid password', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      password: 'pa',
      name: 'Test User',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(422)
  })
  test('Register no avatar', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      password: 'password',
      name: 'Test User',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    assert.exists(response.body().token)
  })
  test('Register w invalid avatar', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUserAvatar',
      password: 'password',
      name: 'Test User',
      avatar: 'invalid avatar',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(422)
  })
  test('Register w avatar', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUserAvatar',
      password: 'password',
      name: 'Test User',
      avatar: 'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    assert.exists(response.body().token)

    const user = await User.findBy('username', 'TestUserAvatar')

    assert.isNotNull(user)
    assert.equal(
      user?.avatar,
      'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs='
    )
  })
  test('Check db new user', async ({ assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
  })
  test('Register using existant username', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      password: 'password',
      name: 'Test User 2',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(422)
  })
  test('Login failed', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      username: 'TestUser2',
      password: 'password',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(400)
    response.assertBodyContains({ errors: [{ message: 'Invalid user credentials' }] })
  })
  test('Login', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      username: 'TestUser',
      password: 'password',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    assert.exists(response.body().token)
  })
  test('Update user not authentificated', async ({ client }) => {
    const response = await client.put('/auth/user').json({
      password: 'password2',
      name: 'Test User 2',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(401)
  })
  test('Update user', async ({ client, assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
    if (!user) return

    const response = await client.put('/auth/user').loginAs(user).json({
      password: 'password2',
      name: 'Test User 2',
      avatar: 'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
    })

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    response.assertBodyContains({ name: 'Test User 2' })
    response.assertBodyContains({
      avatar: 'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
    })
  })
  test('Get logged in user', async ({ client, assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get('/auth/user').loginAs(user)

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    response.assertBodyContains({ name: 'Test User 2' })
    response.assertBodyContains({
      avatar: 'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
    })
  })
  test('Delete user', async ({ client, assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
    if (!user) return

    const response = await client.delete('/auth/user').loginAs(user)

    response.assertAgainstApiSpec()
    response.assertStatus(200)
    response.assertBodyContains({ message: 'User deleted' })
  })
  test('Check db deleted user', async ({ assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNull(user)
  })
})
