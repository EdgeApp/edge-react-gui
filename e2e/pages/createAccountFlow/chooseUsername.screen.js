/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const Username = () => {
  const elements = {
    usernameInput: () => element(by.type('RCTUITextField')),
    usernameTakenError: () => element(by.text('Username already exists')),
    usernameTooShortError: () => element(by.text('Minimum 3 characters')),
    usernameInvalidCharactersError: () => element(by.text('Must only be ascii characters')),
    nextButton: () => element(by.text('Next'))
  }

  return {
    ...elements
  }
}

export default Username()
