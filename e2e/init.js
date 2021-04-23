/* eslint-disable flowtype/require-valid-file-annotation */
// /* globals jasmine beforeAll afterAll */
/* eslint-env detox/detox, jest */

import detox from 'detox'

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  await detox.init()
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      contacts: 'YES'
    }
  })
})

afterAll(async () => {
  await detox.cleanup()
})
