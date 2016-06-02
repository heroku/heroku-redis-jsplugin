'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')

let command = require('../../../lib/commands/redis/maintenance.js')

describe('heroku redis:maintenance', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
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
})
