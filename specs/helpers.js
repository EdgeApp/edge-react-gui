// @flow
/* globals spec */

// import ENV from '../env.json'

// const dummyTouchIdInfo = {
//   isTouchEnabled: false,
//   isTouchSupported: false
// }

// export const fastLogin = async (login, username = ENV.CAVY_USERNAME, password = ENV.CAVY_PASSWORD) => {
//   const account = await login.props.context.loginWithPassword(username, password)
//   await login.props.onLogin(account, dummyTouchIdInfo)
// }

// create a function to fake that the modal is selected . simulate the modal behavior
export const helpers = (spec: any) => ({
  resolveModal: async (modalName: string, returnValue: string) => {
    const modal = await spec.findComponent(modalName)
    return await modal.props.bridge.resolve(returnValue)
  }
})