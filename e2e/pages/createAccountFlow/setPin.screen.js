/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const Pin = () => {
  const elements = {
    nextButton: () => element(by.text('Next')),
    pinInput: () => element(by.type('RCTUITextField'))
  }

  const actions = {
    check: async () => {
      await waitFor(elements.pinInput()).toBeVisible().withTimeout(5000)
      await expect(elements.pinInput()).toExist()
    }
  }

  return {
    ...elements,
    ...actions
  }
}
export default Pin()
