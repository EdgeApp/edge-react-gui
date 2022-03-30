// @flow

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
  },
  longPress: async (walletName: string) => {
    const row = await spec.findComponent(walletName)
    row.props.onLongPress()
  },
  getWalletListRows: async (walletListName: string) => {
    const walletList = await spec.findComponent(walletListName)
    // call the componenet in order to return the list of rows
    return walletList.getWalletList()
  },

  // TODOS:
  // finish getListRows and longPress

  waitTransition: async () => await spec.pause(300)
})

// export const openSideMenu = async sceneName => void
// .. await spec.pause(200) the time should be added to the hepler so that

// TODO
// export const fillSendScene = async (sendScene, options) =>  tx
// export const fillExchangeScene = async (exchangeScene, toOptions, fromOptions) =>  tx
// export const scrollScene = async (scene, rowsToScroll) =>  tx
