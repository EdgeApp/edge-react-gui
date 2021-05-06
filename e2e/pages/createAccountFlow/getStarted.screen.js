/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class GetStarted {
  // Element getters
  get getStartedButton() {
    return element(by.text('Get Started'))
  }
}

export default new GetStarted()
