/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe beforeEach expect it element by */
/* eslint-env detox/detox, jest */

import { Date } from 'core-js'
import { waitFor } from 'detox'

import { launchAppWithPermissions, navigateToLanding } from '../utils.js'

// FUNCTIONS
// const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const genUsername = () => 'TU' + Date.now()
const findByText = locator => element(by.text(locator))

// DATA
const USERNAME = {
  tooShort: '12',
  invalidCharacters: "username'",
  taken: 'JS test 0',
  valid: genUsername()
}

const PASSWORD = {
  tooShort: 'yMvPLFupQ',
  lacksNumber: 'yMvPLFupQj',
  lacksUppercase: 'y768mv4plfupqjmu',
  lacksLowercase: 'Y768MV4PLFUPQjMU',
  mismatch: 'uMjQpuFLP4vM867y',
  valid: 'y768Mv4PLFupQjMu'
}

beforeEach(async () => {
  await launchAppWithPermissions()
  // await navigateToHome()
})

describe('Edge GUI: ', () => {
  it('should be able to simply create an account', async () => {
    // MATCHERS(Caon't be in before. Will be moved to POM)
    const createAccountButton = element(by.text('Create account'))
    const getStartedButton = element(by.text('Get Started'))
    const usernameInput = element(by.type('RCTUITextField'))
    const nextButton = element(by.text('Next'))
    const usernameTakenError = element(by.text('Username already exists'))
    const passwordInput = element(by.type('RCTUITextField')).atIndex(0)
    const confirmPasswordInput = element(by.type('RCTUITextField')).atIndex(1)
    const passwordMismatchError = element(by.text('Does not match password'))
    const pinInput = element(by.type('RCTUITextField'))
    const confirmation1 = element(by.type('RCTImageView')).atIndex(0)
    const confirmation2 = element(by.type('RCTImageView')).atIndex(1)
    const confirmation3 = element(by.type('RCTImageView')).atIndex(2)
    const confirmation4 = element(by.type('RCTImageView')).atIndex(3)
    const confirmFinishButton = element(by.text('Confirm & Finish'))
    // const usernameTooShortError = element(by.text('Minimum 3 characters'))
    // const usernameInvalidCharactersError = element(by.text('Must only be ascii characters'))
    // const walletListScene = element(by.text('Slide wallets to show more options'))

    // NAVIGATE TO CREATE ACCOUNT
    await expect(createAccountButton).toExist()
    await createAccountButton.tap()
    await expect(getStartedButton).toBeVisible()

    // NAVIGATE TO CHOOSE USERNAME
    await getStartedButton.tap()
    await expect(usernameInput).toBeVisible()
    await expect(nextButton).toBeVisible()

    // VALID USERNAME
    await usernameInput.typeText(genUsername())
    await expect(usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await nextButton.tap()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
    await expect(nextButton).toBeVisible()

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

    // NAVIGATE TO ACCOUNT CONFIRMATION
    await nextButton.tap()

    // WAIT FOR LOADING SCREEN
    await waitFor(findByText("Almost done! Let's write down your account information")).toBeVisible().withTimeout(5000)

    // NAVIGATE TO REVIEW
    await nextButton.tap()
    // await waitFor(confirmation1).toBeVisible().withTimeout(5000)
    await expect(confirmation1).toBeVisible()
    await expect(confirmation2).toBeVisible()
    await expect(confirmation3).toBeVisible()
    await expect(confirmation4).toBeVisible()
    await expect(confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await confirmation1.tap()
    await confirmation2.tap()
    await confirmation3.tap()
    await confirmation4.tap()
    expect(confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await confirmFinishButton.tap()

    // ASSERT DASHBOARD SHOWN
    await waitFor(findByText('Slide wallets to show more options')).toBeVisible().withTimeout(10000)
    await expect(findByText('Slide wallets to show more options')).toBeVisible()
  })

  it('should be able to fix invalid inputs & create account', async () => {
    // MATCHERS(Caon't be in before. Will be moved to POM)
    const createAccountButton = element(by.text('Create account'))
    const getStartedButton = element(by.text('Get Started'))
    const usernameInput = element(by.type('RCTUITextField'))
    const nextButton = element(by.text('Next'))
    const usernameTooShortError = element(by.text('Minimum 3 characters'))
    const usernameInvalidCharactersError = element(by.text('Must only be ascii characters'))
    const usernameTakenError = element(by.text('Username already exists'))
    const passwordInput = element(by.type('RCTUITextField')).atIndex(0)
    const confirmPasswordInput = element(by.type('RCTUITextField')).atIndex(1)
    const passwordMismatchError = element(by.text('Does not match password'))
    const pinInput = element(by.type('RCTUITextField'))
    const confirmation1 = element(by.type('RCTImageView')).atIndex(0)
    const confirmation2 = element(by.type('RCTImageView')).atIndex(1)
    const confirmation3 = element(by.type('RCTImageView')).atIndex(2)
    const confirmation4 = element(by.type('RCTImageView')).atIndex(3)
    const confirmFinishButton = element(by.text('Confirm & Finish'))
    // const walletListScene = element(by.text('Slide wallets to show more options'))

    // NAVIGATE TO LANDING PAGE
    await navigateToLanding()

    // NAVIGATE TO CREATE ACCOUNT
    await expect(createAccountButton).toExist()
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
    await usernameInput.typeText(genUsername())
    await expect(usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await nextButton.tap()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
    await expect(nextButton).toBeVisible()

    // PASSWORD MISMATCH(confirm password is fixed before password is fixed)
    await confirmPasswordInput.typeText(PASSWORD.mismatch)
    await passwordInput.typeText(PASSWORD.valid)
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

    // NAVIGATE TO ACCOUNT CONFIRMATION
    await nextButton.tap()

    // WAIT FOR LOADING SCREEN
    await waitFor(findByText("Almost done! Let's write down your account information")).toBeVisible().withTimeout(5000)

    // NAVIGATE TO REVIEW
    await nextButton.tap()
    // await waitFor(confirmation1).toBeVisible().withTimeout(5000)
    await expect(confirmation1).toBeVisible()
    await expect(confirmation2).toBeVisible()
    await expect(confirmation3).toBeVisible()
    await expect(confirmation4).toBeVisible()
    await expect(confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await confirmation1.tap()
    await confirmation2.tap()
    await confirmation3.tap()
    await confirmation4.tap()
    expect(confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await confirmFinishButton.tap()

    // ASSERT DASHBOARD SHOWN
    await waitFor(findByText('Slide wallets to show more options')).toBeVisible().withTimeout(10000)
    await expect(findByText('Slide wallets to show more options')).toBeVisible()
  })
})
