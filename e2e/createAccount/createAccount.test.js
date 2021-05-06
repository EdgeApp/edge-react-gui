/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-env detox/detox, jest */

import { Date } from 'core-js'

import { AccountInfo, GetStarted, Password, Pin, Terms, Username } from '../pages/createAccountFlow'
import Landing from '../pages/landing.screen'
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

beforeEach(async () => {
  await launchAppWithPermissions()
})

afterEach(async () => {
  // await navigateFromPinToLanding()
})

describe('Edge GUI: When Creating an Account: ', () => {
  it('should be able to fix invalid inputs & create account', async () => {
    // NAVIGATE TO CREATE ACCOUNT
    await waitFor(Landing.createAccountButton).toBeVisible().withTimeout(5000)
    await expect(Landing.createAccountButton).toExist()
    await Landing.createAccountButton.tap()
    await expect(GetStarted.getStartedButton).toBeVisible()

    // NAVIGATE TO CHOOSE USERNAME
    await GetStarted.getStartedButton.tap()
    // await waitFor(Username.usernameInput).toBeVisible().withTimeout(5000)
    // await expect(Username.nextButton).toBeVisible()

    // TOO SHORT
    await Username.usernameInput.typeText(USERNAME.tooShort)
    await expect(Username.usernameTooShortError).toBeVisible()
    await Username.usernameInput.clearText()

    // INVALID CHARACTERS
    await Username.usernameInput.typeText(USERNAME.invalidCharacters)
    await expect(Username.usernameInvalidCharactersError).toBeVisible()
    await Username.usernameInput.clearText()

    // USERNAME TAKEN
    await Username.usernameInput.typeText(USERNAME.taken)
    await Username.nextButton.tap()
    await expect(Username.usernameTakenError).toBeVisible()
    await Username.usernameInput.clearText()

    // VALID USERNAME
    await Username.usernameInput.typeText(USERNAME.valid)
    await expect(Username.usernameTakenError).toBeNotVisible()

    // NAVIGATE TO CHOOSE PASSWORD
    await Username.nextButton.tap()
    await expect(Password.passwordInput).toBeVisible()
    await expect(Password.confirmPasswordInput).toBeVisible()
    await expect(Password.nextButton).toBeVisible()

    // PASSWORD MISMATCH(confirm password is fixed before password is fixed)
    await Password.confirmPasswordInput.typeText(PASSWORD.mismatch)
    await Password.passwordInput.typeText(PASSWORD.valid)
    await expect(Password.passwordMismatchError).toExist()
    await Password.passwordInput.clearText()
    await Password.confirmPasswordInput.clearText()

    // VALID PASSWORD
    await Password.passwordInput.typeText(PASSWORD.valid)
    await Password.confirmPasswordInput.typeText(PASSWORD.valid)
    await expect(Password.passwordMismatchError).toNotExist()

    // NAVIGATE TO CHOOSE PIN
    await Password.nextButton.tap()
    await expect(Pin.pinInput).toExist()
    await expect(Pin.nextButton).toBeVisible()

    // VALID PIN
    await Pin.pinInput.typeText('1234')

    // NAVIGATE TO ACCOUNT CONFIRMATION
    await Pin.nextButton.tap()

    // WAIT FOR LOADING SCREEN
    await waitFor(findByText("Almost done! Let's write down your account information")).toBeVisible().withTimeout(5000)

    // NAVIGATE TO REVIEW
    await AccountInfo.nextButton.tap()
    // await waitFor(confirmation1).toBeVisible().withTimeout(5000)
    await expect(Terms.confirmation1).toBeVisible()
    await expect(Terms.confirmation2).toBeVisible()
    await expect(Terms.confirmation3).toBeVisible()
    await expect(Terms.confirmation4).toBeVisible()
    await expect(Terms.confirmFinishButton).toBeNotVisible()

    // CONFIRM
    await Terms.confirmation1.tap()
    await Terms.confirmation2.tap()
    await Terms.confirmation3.tap()
    await Terms.confirmation4.tap()
    expect(Terms.confirmFinishButton).toBeVisible()

    // NAVIGATE TO WALLET LIST
    await Terms.confirmFinishButton.tap()

    // ASSERT DASHBOARD SHOWN
    await waitFor(findByText('Slide wallets to show more options')).toBeVisible().withTimeout(10000)
    await expect(findByText('Slide wallets to show more options')).toBeVisible()
  })
})
