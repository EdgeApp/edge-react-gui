/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-env detox/detox, jest */

export const sleep = async milliseconds => {
  new Promise(resolve => setTimeout(resolve, milliseconds)) // eslint-disable-line no-new
}

export const navigateFromPinToLanding = async () => {
  // NAVIGATE TO Landing Scene
  const loginScene = element(by.id('edge: login-scene'))
  const exitPinButton = element(by.text('Exit PIN'))
  const createAccountButton = element(by.text('Create an Account'))
  const exitButton = element(by.text('Exit'))

  // App opens on pin screen with previous signup/login
  await expect(loginScene).toExist()
  await expect(exitPinButton).toExist()
  await exitPinButton.tap()
  await expect(createAccountButton).toExist()
  await createAccountButton.tap()
  await expect(exitButton).toExist()
  await exitButton.tap()
}
