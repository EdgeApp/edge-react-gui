import * as ACTION from './action.js'

export const settings = (state = {}, action) => {
  const {type, data = {} } = action

  switch (type) {
  case ACTION.UPDATE_SETTINGS: {
    const {settings} = data
    return settings
  }

  case ACTION.LOAD_SETTINGS: {
    const {settings} = data
    return settings
  }

  case ACTION.SET_AUTO_LOGOUT_TIME: {
    const {autoLogoutTime} = data
    return {
      ...state,
      autoLogoutTime
    }
  }

  case ACTION.SET_DEFAULT_FIAT: {
    const {defaultFiat} = data
    return {
      ...state,
      defaultFiat
    }
  }

  case ACTION.SET_MERCHANT_MODE: {
    const {merchantMode} = data
    return {
      ...state,
      merchantMode
    }
  }

  case ACTION.SET_BLUETOOTH_MODE: {
    const {bluetoothMode} = data
    return {
      ...state,
      bluetoothMode
    }
  }

  case ACTION.SET_BITCOIN_DENOMINATION: {
    const {denomination} = data
    const BTC = state['BTC']
    return {
      ...state,
      BTC: {
        ...BTC,
        denomination
      }
    }
  }

  case ACTION.SET_BITCOINCASH_DENOMINATION: {
    const {denomination} = data
    const BCH = state['BCH']
    return {
      ...state,
      BCH: {
        ...BCH,
        denomination
      }
    }
  }

  case ACTION.SET_LITECOIN_DENOMINATION: {
    const {denomination} = data
    const LTC = state['LTC']
    return {
      ...state,
      LTC: {
        ...LTC,
        denomination
      }
    }
  }

  case ACTION.SET_BITCOIN_OVERRIDE_SERVER: {
    const {overrideServer} = data
    const BTC = state['BTC']
    return {
      ...state,
      BTC: {
        ...BTC,
        overrideServer
      }
    }
  }

  case ACTION.SET_ETHEREUM_DENOMINATION: {
    const {denomination} = data
    const ETH = state['ETH']
    return {
      ...state,
      ETH: {
        ...ETH,
        denomination
      }
    }
  }

  default:
    return state
  }
}
