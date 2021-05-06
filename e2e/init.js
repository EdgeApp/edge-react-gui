/* eslint-disable flowtype/require-valid-file-annotation */
/* globals jasmine beforeAll afterAll */

import detox from 'detox'

import config from '../package.json'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  await detox.init(config.detox)
})

afterAll(async () => {
  await detox.cleanup()
})
