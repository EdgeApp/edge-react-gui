/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe beforeEach expect it element by */

import { launchAppWithPermissions, navigateToHome } from '../utils.js'

beforeEach(async () => {
  await launchAppWithPermissions()
  await navigateToHome()
})

describe.skip('Edge', () => {
  it('should be able to create account', async () => {
    // MATCHERS
    const createAccountButton = element(by.text('Create an account'))
    const getStartedButton = element(by.text('Get started'))
    const usernameInput = element(by.type('RCTTextField'))
    const nextButton = element(by.text('NEXT'))
    const usernameTooShortError = element(by.text('Minimum 3 characters'))
    const usernameInvalidCharactersError = element(by.text('Must only be ascii characters'))
    const usernameTakenError = element(by.text('Username already exists'))
    const passwordInput = element(by.type('RCTTextField')).atIndex(1)
    const confirmPasswordInput = element(by.type('RCTTextField')).atIndex(0)
    const passwordMismatchError = element(by.text('Does not match password'))
    const pinInput = element(by.id('edge-login-rn: pin-input'))
    const doneButton = element(by.text('Done'))
    const confirmation1 = element(by.type('RCTText')).atIndex(7)
    const confirmation2 = element(by.type('RCTText')).atIndex(6)
    const confirmation3 = element(by.type('RCTText')).atIndex(5)
    const confirmFinishButton = element(by.text('Confirm & Finish'))
    const walletListScene = element(by.id('edge: wallet-list-scene'))

    const USERNAME = {
      tooShort: '12',
      invalidCharacters: "username'",
      taken: 'JS test 0',
      valid: 'JS test 1'
    }

    const PASSWORD = {
      tooShort: 'yMvPLFupQ',
      lacksNumber: 'yMvPLFupQj',
      lacksUppercase: 'y768mv4plfupqjmu',
      lacksLowercase: 'Y768MV4PLFUPQjMU',
      mismatch: 'uMjQpuFLP4vM867y',
      valid: 'y768Mv4PLFupQjMu'
    }

    await expect(createAccountButton).toExist()

    // NAVIGATE TO CREATE ACCOUNT
    await createAccountButton.tap()
    await expect(getStartedButton).toBeVisible()

    // NAVIGATE TO CHOOSE USERNAME
    await getStartedButton.tap()
    await expect(usernameInput).toBeVisible()
    await expect(nextButton).toBeVisible()

    // TOO SHORT
    await usernameInput.typeText(USERNAME.tooShort)
    await expect(usernameTooShortError).toBeVisible()
    await usernameInput.clearText()

    // INVALID CHARACTERS
    await usernameInput.typeText(USERNAME.invalidCharacters)
    await expect(usernameInvalidCharactersError).toBeVisible()
    await usernameInput.clearText()

    // USERNAME TAKEN
    await usernameInput.typeText(USERNAME.taken)
    await nextButton.tap()
    await expect(usernameTakenError).toBeVisible()
    await usernameInput.clearText()

    // VALID USERNAME
    await usernameInput.typeText(USERNAME.valid)
    await expect(usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await nextButton.tap()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
    await expect(nextButton).toBeVisible()

    // PASSWORD MISMATCH
    await passwordInput.typeText(PASSWORD.valid)
    await confirmPasswordInput.typeText(PASSWORD.mismatch)
    await expect(passwordMismatchError).toExist()
    await passwordInput.clearText()
    await confirmPasswordInput.clearText()

    // VALID PASSWORD
    await passwordInput.typeText(PASSWORD.valid)
    await confirmPasswordInput.typeText(PASSWORD.valid)
    await expect(passwordMismatchError).toNotExist()

    // NAVIGATE TO CHOOSE PIN
    await nextButton.tap()
    await expect(pinInput).toExist()
    await expect(nextButton).toBeVisible()

    // VALID PIN
    await pinInput.typeText('1234')

    // NAVIGATE TO ACCOUNT DETAILS
    await nextButton.tap()

    // NAVIGATE TO REVIEW
    await doneButton.tap()
    await expect(confirmation1).toBeVisible()
    await expect(confirmation2).toBeVisible()
    await expect(confirmation3).toBeVisible()
    await expect(confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await confirmation1.tap()
    await confirmation2.tap()
    await confirmation3.tap()
    expect(confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await confirmFinishButton.tap()
    await expect(walletListScene).toExist()
  })
})
