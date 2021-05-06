/* eslint-disable no-undef */
/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class Landing {
  // Element getters
  get createAccountButton() {
    return element(by.text('Create account'))
  }
}

export default new Landing()
