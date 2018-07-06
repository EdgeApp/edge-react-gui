/* eslint-disable flowtype/require-valid-file-annotation */
/* globals device expect element by */

export const navigateToHome = async () => {
  // NAVIGATE TO HOME
  const loginScene = element(by.id('edge: login-scene'))
  const exitPinButton = element(by.text('EXIT PIN'))

  await expect(loginScene).toExist()
  await expect(exitPinButton).toExist()
  await exitPinButton.tap()
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
