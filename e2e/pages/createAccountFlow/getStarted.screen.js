/* eslint-disable no-undef */
/* eslint-disable flowtype/require-valid-file-annotation */

const GetStarted = () => {
  const elements = {
    getStartedButton: () => element(by.text('Get Started'))
  }

  return {
    ...elements
  }
}

export default GetStarted()
