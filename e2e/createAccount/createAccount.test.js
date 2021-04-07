/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-env detox/detox, jest */

import { Date } from 'core-js'

import { launchAppWithPermissions } from '../utils.js'

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

const loginscene = () => ({
  createAccountButton: element(by.text('Create account')),
  getStartedButton: element(by.text('Get Started')),
  usernameInput: element(by.type('RCTUITextField')),
  nextButton: element(by.text('Next')),
  usernameTakenError: element(by.text('Username already exists')),
  passwordInput: element(by.type('RCTUITextField')).atIndex(0),
  confirmPasswordInput: element(by.type('RCTUITextField')).atIndex(1),
  passwordMismatchError: element(by.text('Does not match password')),
  pinInput: element(by.type('RCTUITextField')),
  confirmation1: element(by.type('RCTImageView')).atIndex(0),
  confirmation2: element(by.type('RCTImageView')).atIndex(1),
  confirmation3: element(by.type('RCTImageView')).atIndex(2),
  confirmation4: element(by.type('RCTImageView')).atIndex(3),
  confirmFinishButton: element(by.text('Confirm & Finish')),
  usernameTooShortError: element(by.text('Minimum 3 characters')),
  usernameInvalidCharactersError: element(by.text('Must only be ascii characters')),
  walletListScene: element(by.text('Slide wallets to show more options'))
})

beforeEach(async () => {
  await launchAppWithPermissions()
})

afterEach(async () => {
  // await navigateFromPinToLanding()
})

describe('Edge GUI: ', () => {
  it('should be able to simply create an account', async () => {
    const loginScene = loginscene()

    // NAVIGATE TO CREATE ACCOUNT
    await waitFor(loginScene.createAccountButton).toBeVisible().withTimeout(5000)
    await expect(loginScene.createAccountButton).toExist()
    await loginScene.createAccountButton.tap()
    await expect(loginScene.getStartedButton).toBeVisible()

    // NAVIGATE TO CHOOSE USERNAME
    await loginScene.getStartedButton.tap()
    await expect(loginScene.usernameInput).toBeVisible()
    await expect(loginScene.nextButton).toBeVisible()

    // VALID USERNAME
    await loginScene.usernameInput.typeText(USERNAME.valid)
    await expect(loginScene.usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await loginScene.nextButton.tap()
    await expect(loginScene.passwordInput).toBeVisible()
    await expect(loginScene.confirmPasswordInput).toBeVisible()
    await expect(loginScene.nextButton).toBeVisible()

    // VALID PASSWORD
    await loginScene.passwordInput.typeText(PASSWORD.valid)
    await loginScene.confirmPasswordInput.typeText(PASSWORD.valid)
    await expect(loginScene.passwordMismatchError).toNotExist()

    // NAVIGATE TO CHOOSE PIN
    await loginScene.nextButton.tap()
    await expect(loginScene.pinInput).toExist()
    await expect(loginScene.nextButton).toBeVisible()

    // VALID PIN
    await loginScene.pinInput.typeText('1234')

    // NAVIGATE TO ACCOUNT CONFIRMATION
    await loginScene.nextButton.tap()

    // WAIT FOR LOADING SCREEN
    await waitFor(findByText("Almost done! Let's write down your account information")).toBeVisible().withTimeout(5000)

    // NAVIGATE TO REVIEW
    await loginScene.nextButton.tap()
    // await waitFor(confirmation1).toBeVisible().withTimeout(5000)
    await expect(loginScene.confirmation1).toBeVisible()
    await expect(loginScene.confirmation2).toBeVisible()
    await expect(loginScene.confirmation3).toBeVisible()
    await expect(loginScene.confirmation4).toBeVisible()
    await expect(loginScene.confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await loginScene.confirmation1.tap()
    await loginScene.confirmation2.tap()
    await loginScene.confirmation3.tap()
    await loginScene.confirmation4.tap()
    expect(loginScene.confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await loginScene.confirmFinishButton.tap()

    // ASSERT DASHBOARD SHOWN
    await waitFor(findByText('Slide wallets to show more options')).toBeVisible().withTimeout(10000)
    await expect(findByText('Slide wallets to show more options')).toBeVisible()
  })

  xit('should be able to fix invalid inputs & create account', async () => {
    const loginScene = loginscene()

    // NAVIGATE TO CREATE ACCOUNT
    await waitFor(loginScene.createAccountButton).toBeVisible().withTimeout(5000)
    await expect(loginScene.createAccountButton).toExist()
    await loginScene.createAccountButton.tap()
    await expect(loginScene.getStartedButton).toBeVisible()

    // NAVIGATE TO CHOOSE USERNAME
    await loginScene.getStartedButton.tap()
    await expect(loginScene.usernameInput).toBeVisible()
    await expect(loginScene.nextButton).toBeVisible()

    // TOO SHORT
    await loginScene.usernameInput.typeText(USERNAME.tooShort)
    await expect(loginScene.usernameTooShortError).toBeVisible()
    await loginScene.usernameInput.clearText()

    // INVALID CHARACTERS
    await loginScene.usernameInput.typeText(USERNAME.invalidCharacters)
    await expect(loginScene.usernameInvalidCharactersError).toBeVisible()
    await loginScene.usernameInput.clearText()

    // USERNAME TAKEN
    await loginScene.usernameInput.typeText(USERNAME.taken)
    await loginScene.nextButton.tap()
    await expect(loginScene.usernameTakenError).toBeVisible()
    await loginScene.usernameInput.clearText()

    // VALID USERNAME
    await loginScene.usernameInput.typeText(USERNAME.valid)
    await expect(loginScene.usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await loginScene.nextButton.tap()
    await expect(loginScene.passwordInput).toBeVisible()
    await expect(loginScene.confirmPasswordInput).toBeVisible()
    await expect(loginScene.nextButton).toBeVisible()

    // PASSWORD MISMATCH(confirm password is fixed before password is fixed)
    await loginScene.confirmPasswordInput.typeText(PASSWORD.mismatch)
    await loginScene.passwordInput.typeText(PASSWORD.valid)
    await expect(loginScene.passwordMismatchError).toExist()
    await loginScene.passwordInput.clearText()
    await loginScene.confirmPasswordInput.clearText()

    // VALID PASSWORD
    await loginScene.passwordInput.typeText(PASSWORD.valid)
    await loginScene.confirmPasswordInput.typeText(PASSWORD.valid)
    await expect(loginScene.passwordMismatchError).toNotExist()

    // NAVIGATE TO CHOOSE PIN
    await loginScene.nextButton.tap()
    await expect(loginScene.pinInput).toExist()
    await expect(loginScene.nextButton).toBeVisible()

    // VALID PIN
    await loginScene.pinInput.typeText('1234')

    // NAVIGATE TO ACCOUNT CONFIRMATION
    await loginScene.nextButton.tap()

    // WAIT FOR LOADING SCREEN
    await waitFor(findByText("Almost done! Let's write down your account information")).toBeVisible().withTimeout(5000)

    // NAVIGATE TO REVIEW
    await loginScene.nextButton.tap()
    // await waitFor(confirmation1).toBeVisible().withTimeout(5000)
    await expect(loginScene.confirmation1).toBeVisible()
    await expect(loginScene.confirmation2).toBeVisible()
    await expect(loginScene.confirmation3).toBeVisible()
    await expect(loginScene.confirmation4).toBeVisible()
    await expect(loginScene.confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await loginScene.confirmation1.tap()
    await loginScene.confirmation2.tap()
    await loginScene.confirmation3.tap()
    await loginScene.confirmation4.tap()
    expect(loginScene.confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await loginScene.confirmFinishButton.tap()

    // ASSERT DASHBOARD SHOWN
    await waitFor(findByText('Slide wallets to show more options')).toBeVisible().withTimeout(10000)
    await expect(findByText('Slide wallets to show more options')).toBeVisible()
  })
})
