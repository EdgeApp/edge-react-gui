/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const Password = () => {
  const elements = {
    createAccountButton: () => element(by.text('Create account')),
    getStartedButton: () => element(by.text('Get Started')),
    usernameInput: () => element(by.type('RCTUITextField')),
    nextButton: () => element(by.text('Next')),
    usernameTakenError: () => element(by.text('Username already exists')),
    passwordInput: () => element(by.type('RCTUITextField')).atIndex(0),
    confirmPasswordInput: () => element(by.type('RCTUITextField')).atIndex(1),
    passwordMismatchError: () => element(by.text('Does not match password')),
    pinInput: () => element(by.type('RCTUITextField')),
    confirmation1: () => element(by.type('RCTImageView')).atIndex(0),
    confirmation2: () => element(by.type('RCTImageView')).atIndex(1),
    confirmation3: () => element(by.type('RCTImageView')).atIndex(2),
    confirmation4: () => element(by.type('RCTImageView')).atIndex(3),
    confirmFinishButton: () => element(by.text('Confirm & Finish')),
    usernameTooShortError: () => element(by.text('Minimum 3 characters')),
    usernameInvalidCharactersError: () => element(by.text('Must only be ascii characters')),
    walletListScene: () => element(by.text('Slide wallets to show more options'))
  }

  return {
    ...elements
  }
}

export default Password()
