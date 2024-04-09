import { test } from '@japa/runner'
import User from '#models/user'

test.group('User Test suite', () => {
  test('Invalid username', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'Test User+',
      password: 'password',
      name: 'Test User',
    })

    response.assertStatus(422)
  })
  test('Invalid password', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      password: 'pa',
      name: 'Test User',
    })

    response.assertStatus(422)
  })
  test('Register', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      password: 'password',
      name: 'Test User',
    })

    response.assertStatus(200)
    assert.exists(response.body().token)
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

    response.assertStatus(422)
  })
  test('Login failed', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      username: 'TestUser2',
      password: 'password',
    })

    response.assertStatus(400)
    response.assertBodyContains({ errors: [{ message: 'Invalid user credentials' }] })
  })
  test('Login', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      username: 'TestUser',
      password: 'password',
    })

    response.assertStatus(200)
    assert.exists(response.body().token)
  })
  test('Update user not authentificated', async ({ client }) => {
    const response = await client.put('/auth/user').json({
      password: 'password2',
      name: 'Test User 2',
    })

    response.assertStatus(401)
  })
  test('Update user', async ({ client, assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
    if (!user) return

    const response = await client.put('/auth/user').loginAs(user).json({
      password: 'password2',
      name: 'Test User 2',
      avatar: 'https://example.com/avatar.png',
    })

    response.assertStatus(200)
    response.assertBodyContains({ name: 'Test User 2' })
    response.assertBodyContains({ avatar: 'https://example.com/avatar.png' })
  })
  test('Delete user', async ({ client, assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNotNull(user)
    if (!user) return

    const response = await client.delete('/auth/user').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'User deleted' })
  })
  test('Check db deleted user', async ({ assert }) => {
    const user = await User.findBy('username', 'TestUser')

    assert.isNull(user)
  })
})
