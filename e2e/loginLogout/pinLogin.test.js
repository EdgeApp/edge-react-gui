/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe beforeEach expect it element by */

import { launchAppWithPermissions } from '../utils.js'

beforeEach(async () => {
  await launchAppWithPermissions()
})

describe.skip('Pin Login', () => {
  it('should be able to pin login', async () => {
    // MATCHERS
    const pinInput = element(by.id('edge-login-rn: pin-input'))
    const walletListScene = element(by.id('edge: wallet-list-scene'))

    // VERIFY PIN LOGIN
    await expect(pinInput).toExist()

    // VALID PIN
    await pinInput.typeText('1234')
    await expect(walletListScene).toExist()
  })
})
