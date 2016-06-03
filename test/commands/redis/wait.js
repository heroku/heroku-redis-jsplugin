'use strict'
/* globals describe it beforeEach afterEach cli */

let nock = require('nock')
let lolex = require('lolex')

let command = require('../../../lib/commands/redis/wait.js')

let clock

describe('heroku redis:timeout', function () {
  require('./shared.js').shouldHandleArgs(command)
})

describe('heroku redis:cli', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    clock = lolex.install()
    clock.setTimeout = function (fn, timeout) { fn() }
  })

  afterEach(function () {
    clock.uninstall()
  })

  it('# waits until waiting? false', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis_waiting = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': false})

    let redis_done = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': true})

    return command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => clock.next())
    .then(() => redis_waiting.done())
    .then(() => clock.next())
    .then(() => redis_done.done())
    // todo: lolex has a bug in clearInterval should verify no more work when fixed
  })

  it('# waits until error', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis_waiting = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(200, {'waiting?': false})

    let redis_done = nock('https://redis-api.heroku.com:443')
      .get('/redis/v0/databases/redis-haiku/wait').reply(503, {'error': 'Error'})

    return command.run({app: 'example', flags: {}, args: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => clock.next())
    .then(() => redis_waiting.done())
    .then(() => clock.next())
    .then(() => redis_done.done())
    // todo: lolex has a bug in clearInterval should verify no more work when fixed
  })
})
