/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const WallentLanding = () => {
  const elements = {
    walletListScene: () => element(by.text('Slide wallets to show more options'))
  }

  const actions = {}

  return {
    ...elements,
    ...actions
  }
}

export default WallentLanding()
