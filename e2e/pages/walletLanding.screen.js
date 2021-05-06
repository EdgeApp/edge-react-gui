/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

class WallentLanding {
  // Element getters
  get walletListScene() {
    return element(by.text('Slide wallets to show more options'))
  }
}

export default new WallentLanding()
