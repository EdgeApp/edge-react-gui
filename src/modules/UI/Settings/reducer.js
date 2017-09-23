import * as ACTION from './action.js'
import {
  SYNCED_ACCOUNT_DEFAULTS,
  LOCAL_ACCOUNT_DEFAULTS,
  CORE_DEFAULTS
} from '../../Core/Account/settings.js'

const initialState = {
  ...SYNCED_ACCOUNT_DEFAULTS,
  ...LOCAL_ACCOUNT_DEFAULTS,
  ...CORE_DEFAULTS,
  plugins: {
    arrayPlugins: [],
    supportedWalletTypes: []
  },
  loginStatus: null
}

export const settings = (state = initialState, action) => {
  const {type, data = {} } = action

  switch (type) {
  case ACTION.SET_LOGIN_STATUS: {
    const {loginStatus} = data
    return {
      ...state,
      loginStatus
    }
  }
  case ACTION.ADD_EXCHANGE_TIMER: {
    const {exchangeTimer} = data
    return {
      ...state,
      exchangeTimer
    }
  }
  case ACTION.UPDATE_SETTINGS: {
    const {settings} = data
    return settings
  }

  case ACTION.LOAD_SETTINGS: {
    const {settings} = data
    return settings
  }

  case ACTION.SET_PIN_MODE: {
    const {pinMode} = data
    return {
      ...state,
      pinMode
    }
  }

  case ACTION.SET_OTP_MODE: {
    const {otpMode} = data
    return {
      ...state,
      otpMode
    }
  }

  case ACTION.SET_AUTO_LOGOUT_TIME: {
    const {autoLogoutTimeInSeconds} = data
    return {
      ...state,
      autoLogoutTimeInSeconds
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

  case ACTION.SET_BTC_DENOMINATION: {
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

  case ACTION.SET_ETH_DENOMINATION: {
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

  case ACTION.SET_LTC_DENOMINATION: {
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

  case ACTION.SET_DENOMINATION_KEY: {
    const currencyCode = data.currencyCode
    const denomination = data.denominationKey
    const currencyState = state[currencyCode]
    return {
      ...state,
      [currencyCode]: {
        ...currencyState,
        denomination
      }
    }
  }

  case ACTION.ADD_CURRENCY_PLUGIN: {
    const {plugins} = state
    const {supportedWalletTypes} = plugins
    const {arrayPlugins} = plugins
    const {pluginName, plugin, walletTypes} = data
    const currencyInfo = plugin.currencyInfo
      // Build up object with all the information for the parent currency, accesible by the currencyCode
    const defaultParentCurrencyInfo = state[currencyInfo.currencyCode]
    const parentCurrencyInfo = {
      [currencyInfo.currencyCode]: {
        ...defaultParentCurrencyInfo,
        currencyName: currencyInfo.currencyName,
        currencyCode: currencyInfo.currencyCode,
        denominations: currencyInfo.denominations,
        symbolImage: currencyInfo.symbolImage
      }
    }

      // Build up object with all the information for each metatoken, accessible by the token currencyCode
    const metatokenCurrencyInfos = currencyInfo.metaTokens.reduce((acc, metatoken) => {
      const defaultMetatokenInfo = state[metatoken.currencyCode]
      return {
        ...acc,
        [metatoken.currencyCode]: {
          ...defaultMetatokenInfo,
          currencyName: metatoken.currencyName,
          currencyCode: metatoken.currencyCode,
          denominations: metatoken.denominations,
          symbolImage: metatoken.symbolImage
        }
      }
    }, {})

      // Build up object with all the currency information for each currency supported by the plugin, accessible by the currencyCode
    const currencyInfos = {
      ...parentCurrencyInfo,
      ...metatokenCurrencyInfos
    }

    return {
      ...state,
      ...currencyInfos,
      plugins: {
        ...plugins,
        [pluginName]: plugin,
        arrayPlugins: [
          ...arrayPlugins,
          plugin
        ],
        supportedWalletTypes: [
          ...supportedWalletTypes,
          ...walletTypes
        ]
      }
    }
  }

  default:
    return state
  }
}
