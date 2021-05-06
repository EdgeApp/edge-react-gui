/* eslint-disable flowtype/require-valid-file-annotation */
/* globals device expect element by */

export const navigateFromPinToLanding = async () => {
  // NAVIGATE TO Landing Scene
  const loginScene = element(by.id('edge: login-scene'))
  const exitPinButton = element(by.text('Exit PIN'))
  const createAccountButton = element(by.text('Create an Account'))
  const exitButton = element(by.text('Exit'))

  await expect(loginScene).toExist()
  await expect(exitPinButton).toExist()
  await exitPinButton.tap()
  await expect(createAccountButton).toExist()
  await createAccountButton.tap()
  await expect(exitButton).toExist()
  await exitButton.tap()
}

export const launchAppWithPermissions = async () => {
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      contacts: 'YES'
    }
  })
}
