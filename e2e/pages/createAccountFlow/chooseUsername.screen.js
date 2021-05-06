/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class Username {
  // Element getters
  get usernameInput() {
    return element(by.type('RCTUITextField'))
  }

  get usernameTakenError() {
    return element(by.text('Username already exists'))
  }

  get usernameTooShortError() {
    return element(by.text('Minimum 3 characters'))
  }

  get usernameInvalidCharactersError() {
    return element(by.text('Must only be ascii characters'))
  }

  get nextButton() {
    return element(by.text('Next'))
  }
}

export default new Username()
