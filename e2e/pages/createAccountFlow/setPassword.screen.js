/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class Password {
  // Element getters
  get createAccountButton() {
    return element(by.text('Create account'))
  }

  get getStartedButton() {
    return element(by.text('Get Started'))
  }

  get usernameInput() {
    return element(by.type('RCTUITextField'))
  }

  get nextButton() {
    return element(by.text('Next'))
  }

  get usernameTakenError() {
    return element(by.text('Username already exists'))
  }

  get passwordInput() {
    return element(by.type('RCTUITextField')).atIndex(0)
  }

  get confirmPasswordInput() {
    return element(by.type('RCTUITextField')).atIndex(1)
  }

  get passwordMismatchError() {
    return element(by.text('Does not match password'))
  }

  get pinInput() {
    return element(by.type('RCTUITextField'))
  }

  get confirmation1() {
    return element(by.type('RCTImageView')).atIndex(0)
  }

  get confirmation2() {
    return element(by.type('RCTImageView')).atIndex(1)
  }

  get confirmation3() {
    return element(by.type('RCTImageView')).atIndex(2)
  }

  get confirmation4() {
    return element(by.type('RCTImageView')).atIndex(3)
  }

  get confirmFinishButton() {
    return element(by.text('Confirm & Finish'))
  }

  get usernameTooShortError() {
    return element(by.text('Minimum 3 characters'))
  }

  get usernameInvalidCharactersError() {
    return element(by.text('Must only be ascii characters'))
  }

  get walletListScene() {
    return element(by.text('Slide wallets to show more options'))
  }
}

export default new Password()
