/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const Terms = () => {
  const elements = {
    confirmation1: () => element(by.type('RCTImageView')).atIndex(0),
    confirmation2: () => element(by.type('RCTImageView')).atIndex(1),
    confirmation3: () => element(by.type('RCTImageView')).atIndex(2),
    confirmation4: () => element(by.type('RCTImageView')).atIndex(3),
    confirmFinishButton: () => element(by.text('Confirm & Finish'))
  }

  const actions = {
    check: async () => {
      await waitFor(elements.createAccountButton()).toBeVisible().withTimeout(5000)
      await expect(elements.createAccountButton()).toExist()
    },

    acceptTerms: async () => {
      elements.confirmation1.tap()
      elements.confirmation2.tap()
      elements.confirmation3.tap()
      elements.confirmation4.tap()
      elements.confirmFinishButton.tap()
    }
  }

  return {
    ...elements,
    ...actions
  }
}

export default Terms()
