import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

test.group('Room Test Suite', () => {
  const state = {
    roomId: '',
    user1Id: -1,
    user2Id: -1,
  }
  test('Create 2 fake users', async ({ assert }) => {
    const user1 = new User()
    user1.username = 'TestUserRoom1'
    user1.password = 'password'
    user1.name = 'Test User 1'
    await user1.save()

    assert.isNotNull(user1.id)
    state.user1Id = user1.id

    const user2 = new User()
    user2.username = 'TestUserRoom2'
    user2.password = 'password'
    user2.name = 'Test User 2'
    await user2.save()

    assert.isNotNull(user2.id)
    state.user2Id = user2.id
  })
  test('Create Room API logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .post('/room')
      .json({
        name: 'Test Room API',
        avatar: 'dataAvatarUri',
      })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'Test Room API',
      avatar: 'dataAvatarUri',
    })
    assert.exists(response.body().id)
    state.roomId = response.body().id
  })
  test('Update Room API logged as User 2 BLOCKED', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .put(`/room/${state.roomId}`)
      .json({
        name: 'Test Room API Updated',
        avatar: 'dataAvatarUriUpdated',
        userIds: [state.user1Id, state.user2Id],
        adminIds: [state.user2Id],
      })
      .loginAs(user)

    response.assertStatus(401)
  })
  test('Update Room API logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .put(`/room/${state.roomId}`)
      .json({
        name: 'Test Room API Updated',
        avatar: 'dataAvatarUriUpdated',
        userIds: [state.user1Id, state.user2Id],
        adminIds: [state.user2Id],
      })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'Test Room API Updated',
      avatar: 'dataAvatarUriUpdated',
    })
    assert.isArray(response.body().users)
    assert.equal(response.body().users.length, 2)
  })
  test('Try again Update Room API logged as User 1 should fail', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .put(`/room/${state.roomId}`)
      .json({
        name: 'Test Room API Updated v2',
        avatar: 'dataAvatarUriUpdated',
        userIds: [state.user1Id, state.user2Id],
        adminIds: [state.user2Id],
      })
      .loginAs(user)

    response.assertStatus(401)
  })
  test('Try again Update Room API logged as User 2 should pass', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .put(`/room/${state.roomId}`)
      .json({
        name: 'Test Room API Updated v2',
        avatar: 'dataAvatarUriUpdated',
        userIds: [state.user1Id, state.user2Id],
        adminIds: [state.user1Id, state.user2Id],
      })
      .loginAs(user)

    response.assertStatus(200)
  })
  test('Check pivot table should be populated', async ({ assert }) => {
    const data = await db.from('room_user').select('*').exec()

    assert.isArray(data)
    assert.equal(data.length, 2)
  })
  test('Delete Room API logged as User 2', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.delete(`/room/${state.roomId}`).loginAs(user)

    response.assertStatus(200)
  })
  test('Check pivot table', async ({ assert }) => {
    const data = await db.from('room_user').select('*').exec()

    assert.isArray(data)
    assert.equal(data.length, 0)
  })
  test('Create Room 1 logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .post('/room')
      .json({
        name: 'Test Room API',
        avatar: 'dataAvatarUri',
      })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'Test Room API',
      avatar: 'dataAvatarUri',
    })
    assert.exists(response.body().id)
    state.roomId = response.body().id
  })
  test('Create Room 2 logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .post('/room')
      .json({
        name: 'Test Room API',
        avatar: 'dataAvatarUri',
      })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'Test Room API',
      avatar: 'dataAvatarUri',
    })
    assert.exists(response.body().id)
    state.roomId = response.body().id
  })
  test('Get all Rooms logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get('/rooms').loginAs(user)

    response.assertStatus(200)
    assert.isArray(response.body().rooms)
    assert.equal(response.body().rooms.length, 2)
  })
  test('Get all Rooms logged as User 2', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get('/rooms').loginAs(user)

    response.assertStatus(200)
    assert.isArray(response.body().rooms)
    assert.equal(response.body().rooms.length, 0)
  })
  test('Get specific Room logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get(`/room/${state.roomId}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      room: {
        id: state.roomId,
        name: 'Test Room API',
        avatar: 'dataAvatarUri',
      },
    })
    assert.isArray(response.body().users)
    assert.exists(response.body().isAdmin)
  })
  test('Get specific Room logged as User 2', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get(`/room/${state.roomId}`).loginAs(user)

    response.assertStatus(401)
  })
  test('Send Join Request logged as User 2', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get(`/room/join/${state.roomId}`).loginAs(user)

    response.assertStatus(200)
  })
  test('Accept Join Request logged as User 1', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user1Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client
      .post(`/room/join/${state.roomId}`)
      .json({
        accept: [state.user2Id],
        reject: [],
      })
      .loginAs(user)

    response.assertStatus(200)
  })

  test('Get specific Room logged as User 2', async ({ client, assert }) => {
    const user = await User.findBy('id', state.user2Id)

    assert.isNotNull(user)
    if (!user) return

    const response = await client.get(`/room/${state.roomId}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      room: {
        id: state.roomId,
        name: 'Test Room API',
        avatar: 'dataAvatarUri',
      },
    })
  })
})
