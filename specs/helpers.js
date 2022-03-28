import ENV from '../env.json'

const dummyTouchIdInfo = {
  isTouchEnabled: false,
  isTouchSupported: false
}

export const fastLogin = async (login, username = ENV.CAVY_USERNAME, password = ENV.CAVY_PASSWORD) => {
  const account = await login.props.context.loginWithPassword(username, password)
  await login.props.onLogin(account, dummyTouchIdInfo)
}

// create a function to fake that the modal is selected . simulate the modal behavior

export const resolveModal = async (modal, returnValue) => {
  return await modal.props.bridge.returnValue
}

// export const openSideMenu = async sceneName => void
// does this actually open the sidemenu??
// .. await spec.pause(200) the time should be added to the hepler so that

// TODO
// export const fillSendScene = async (sendScene, options) =>  tx
// export const fillExchangeScene = async (exchangeScene, toOptions, fromOptions) =>  tx
// export const scrollScene = async (scene, rowsToScroll) =>  tx
