/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class Pin {
  // Element getters
  get nextButton() {
    return element(by.text('Next'))
  }

  get pinInput() {
    return element(by.type('RCTUITextField'))
  }
}

export default new Pin()
