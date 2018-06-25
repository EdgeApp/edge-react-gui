/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe beforeEach device expect it element by */

describe('Edge', () => {
  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should be able to password login', async () => {
    const signInButton = element(by.text('Already have an account? Sign in'))
    const usernameInput = element(by.type('RCTTextField')).atIndex(1)
    const passwordInput = element(by.type('RCTTextField')).atIndex(0)
    const loginButton = element(by.text('Login'))

    await expect(signInButton).toBeVisible()
    await signInButton.tap()

    await expect(usernameInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()

    await usernameInput.typeText('JS test 0')
    await passwordInput.typeText('y768Mv4PLFupQjMu')

    await loginButton.tap()
  })
})
