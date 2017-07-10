import * as ACTION from './action.js'

const initialState = {
  pinMode: false,
  otpMode: false,
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  merchantMode: false,
  'BTC': {
    denomination: 1
  },
  'ETH': {
    denomination: 1
  },
  'TRD': {
    denomination: 1
  }  
}

export const settings = (state = initialState, action) => {
  const { type, data = {} } = action

  switch (type) {
    case ACTION.UPDATE_SETTINGS: {
      const { settings } = data
      return settings
    }

    case ACTION.LOAD_SETTINGS: {
      const { settings } = data
      return settings
    }

    case ACTION.SET_PIN_MODE: {
      const { pinMode } = data
      return {
        ...state,
        pinMode
      }
    }

    case ACTION.SET_OTP_MODE: {
      const { otpMode } = data
      return {
        ...state,
        otpMode
      }
    }

    case ACTION.SET_AUTO_LOGOUT_TIME: {
      const { autoLogoutTimeInSeconds } = data
      return {
        ...state,
        autoLogoutTimeInSeconds
      }
    }

    case ACTION.SET_DEFAULT_FIAT: {
      const { defaultFiat } = data
      return {
        ...state,
        defaultFiat
      }
    }

    case ACTION.SET_MERCHANT_MODE: {
      const { merchantMode } = data
      return {
        ...state,
        merchantMode
      }
    }

    case ACTION.SET_BLUETOOTH_MODE: {
      const { bluetoothMode } = data
      return {
        ...state,
        bluetoothMode
      }
    }

    case ACTION.SET_BITCOIN_DENOMINATION: {
      const { denomination } = data
      const BTC = state['BTC']
      return {
        ...state,
        BTC: {
          ...BTC,
          denomination
        }
      }
    }

    case ACTION.SET_BITCOIN_OVERRIDE_SERVER: {
      const { overrideServer } = data
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
      const { denomination } = data
      const ETH = state['ETH']
      return {
        ...state,
        ETH: {
          ...ETH,
          denomination
        }
      }
    }

    case ACTION.SET_SHITCOIN_DENOMINATION: {
      const { denomination } = data
      const TRD = state['TRD']
      return {
        ...state,
        TRD: {
          ...TRD,
          denomination
        }
      }
    }    

    default:
      return state
  }
}
