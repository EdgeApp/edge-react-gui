/* eslint-disable flowtype/require-valid-file-annotation */
/* globals jasmine beforeAll beforeEach afterAll */

import detox from 'detox'

import config from '../package.json'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  await detox.init(config.detox)
})

beforeEach(async function () {})

afterAll(async () => {
  await detox.cleanup()
})
