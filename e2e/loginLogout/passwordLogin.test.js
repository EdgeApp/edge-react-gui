/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe beforeEach expect it element by */

import { launchAppWithPermissions, navigateToHome } from '../utils.js'

beforeEach(async () => {
  await launchAppWithPermissions()
  await navigateToHome()
})

describe.skip('Edge', () => {
  it('should be able to password login', async () => {
    const usernameInput = element(by.type('RCTTextField')).atIndex(1)
    const passwordInput = element(by.type('RCTTextField')).atIndex(0)
    const loginButton = element(by.text('Login'))
    const walletListScene = element(by.id('edge: wallet-list-scene'))

    await expect(usernameInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toExist()

    await usernameInput.clearText()
    await usernameInput.typeText('JS test 0')
    await passwordInput.typeText('y768Mv4PLFupQjMu')

    await loginButton.tap()
    await expect(walletListScene).toExist()
  })
})
