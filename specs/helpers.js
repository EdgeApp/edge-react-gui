import ENV from '../env.json'

const dummyTouchIdInfo = {
  isTouchEnabled: false,
  isTouchSupported: false
}

export const fastLogin = async (login, username = ENV.CAVY_USERNAME, password = ENV.CAVY_PASSWORD) => {
  const account = await login.props.context.loginWithPassword(username, password)
  await login.props.onLogin(account, dummyTouchIdInfo)
}
