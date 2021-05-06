/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class AccountInfo {
  // Element getters
  get nextButton() {
    return element(by.text('Next'))
  }
}

export default new AccountInfo()
