/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const Landing = () => {
  const elements = {
    createAccountButton: () => element(by.text('Create account'))
  }

  const actions = {
    check: async () => {
      await waitFor(elements.createAccountButton()).toBeVisible().withTimeout(5000)
      await expect(elements.createAccountButton()).toExist()
    }
  }

  return {
    ...elements,
    ...actions
  }
}

export default Landing()
