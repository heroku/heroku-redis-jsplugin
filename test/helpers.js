'use strict'
/* globals cli */

global.cli = require('heroku-cli-util')
cli.raiseErrors = true
cli.color.enabled = false

let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

let nock = require('nock')
nock.disableNetConnect()
