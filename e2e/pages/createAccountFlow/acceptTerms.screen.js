/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class Terms {
  // Element getters
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
}

export default new Terms()
