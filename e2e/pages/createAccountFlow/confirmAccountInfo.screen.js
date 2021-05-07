/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const AccountInfo = () => {
  const elements = {
    nextButton: () => element(by.text('Next'))
  }
  return {
    ...elements
  }
}

export default AccountInfo()
