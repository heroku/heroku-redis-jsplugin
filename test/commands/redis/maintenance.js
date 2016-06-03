'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit

let command = require('../../../lib/commands/redis/maintenance.js')

describe('heroku redis:maintenance', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    exit.mock()
  })

  it('# shows the maintenance message', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .get('/client/v11/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    return command.run({app: 'example', args: {}, flags: {}, auth: {username: 'foobar', password: 'password'}})
    .then(() => app.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal('Message\n'))
    .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# sets the maintenance window', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let redis = nock('https://redis-api.heroku.com:443')
      .put('/client/v11/databases/redis-haiku/maintenance_window', {
        description: 'Mon 10:00'
      }).reply(200, {window: 'Mon 10:00'})

    return expect(command.run({app: 'example', args: {}, flags: {window: 'Mon 10:00'}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(exit.ErrorExit)
    .then(() => app.done())
    .then(() => redis.done)
    .then(() => expect(cli.stdout).to.equal('Maintenance window for redis-haiku (REDIS_FOO, REDIS_BAR) set to Mon 10:00.\n'))
    .then(() => expect(cli.stderr).to.equal(''))
  })

  it('# runs the maintenance', function () {
    let app = nock('https://api.heroku.com:443')
      .get('/apps/example/addons').reply(200, [
        {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, plan: {name: 'premium-0'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
      ])

    let app_info = nock('https://api.heroku.com:443')
      .get('/apps/example').reply(200, { maintenance: true })

    let redis = nock('https://redis-api.heroku.com:443')
      .post('/client/v11/databases/redis-haiku/maintenance').reply(200, {message: 'Message'})

    return expect(command.run({app: 'example', args: {}, flags: {run: true}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(exit.ErrorExit)
    .then(() => app.done())
    .then(() => app_info.done())
    .then(() => redis.done())
    .then(() => expect(cli.stdout).to.equal('Message\n'))
    .then(() => expect(cli.stderr).to.equal(''))
  })
})
