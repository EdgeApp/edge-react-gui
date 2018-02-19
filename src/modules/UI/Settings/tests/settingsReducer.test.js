// @flow

/* globals describe test expect */

import { initialState, settings as settingsReducer } from '../reducer.js'
import { ACCOUNT_INIT_COMPLETE, SET_CONFIRM_PASSWORD_ERROR } from '../../../../constants/ActionConstants.js'
import { fakeBitcoinPlugin, fakeEthereumPlugin, fakeAccount } from './fakes/fakes.js'
import {
  togglePinLoginEnabled,
  setCustomTokens,
  setDenominationKey,
  updateSettings,
  loadSettings,
  setPINMode,
  setOTPMode,
  setAutoLogoutTimeInSeconds,
  setDefaultFiat,
  setMerchantMode,
  setBluetoothMode,
  setBitcoinOverrideServer,
  setSettingsLock,
  updateOtpInfo,
  addTouchIdInfo,
  updateTouchIdEnabled
} from '../../Settings/action.js'
import { updateExistingTokenSuccess, deleteCustomTokenSuccess } from '../../Wallets/action.js'
import { setTokenSettings, addNewTokenSuccess } from '../../../UI/scenes/AddToken/action.js'

describe('settingsReducer', () => {
  test('initialState', () => {
    const expected = initialState
    // $FlowExpectedError
    const actual = settingsReducer(undefined, {})

    expect(actual).toEqual(expected)
  })

  test('ACCOUNT_INIT_COMPLETE, a.k.a. LOGIN', () => {
    const account = fakeAccount
    const bitcoinPlugin = fakeBitcoinPlugin
    const ethereumPlugin = fakeEthereumPlugin
    const myFirstWallet = account.currencyWallets[account.activeWalletIds[0]]

    const accountInitObject = {
      ...initialState,
      account: account,
      activeWalletIds: account.activeWalletIds,
      archivedWalletIds: account.archivedWalletIds,
      autoLogoutTimeInSeconds: 3600,
      bluetoothMode: false,
      currencyCode: myFirstWallet.currencyInfo.currencyCode,
      currencyPlugins: [
        {
          pluginName: bitcoinPlugin.pluginName,
          plugin: bitcoinPlugin,
          walletTypes: bitcoinPlugin.currencyInfo.walletTypes
        },
        {
          pluginName: ethereumPlugin.pluginName,
          plugin: ethereumPlugin,
          walletTypes: ethereumPlugin.currencyInfo.walletTypes
        }
      ],
      currencyWallets: account.currencyWallets,
      customTokens: '',
      customTokensSettings: [],
      defaultFiat: 'USD',
      denominationKeys: [{ currencyCode: 'BTC', denominationKey: 'bitcoin_denomination' }, { currencyCode: 'BCH', denominationKey: 'ethereum_denomination' }],
      loginStatus: true,
      merchantMode: false,
      otpInfo: {
        enabled: account.otpEnabled,
        otpKey: account.otpKey,
        otpResetPending: false
      },
      otpMode: false,
      pinLoginEnabled: true,
      pinMode: false,
      touchIdInfo: {
        isTouchEnabled: false,
        isTouchSupported: false
      },
      walletId: myFirstWallet.id
    }
    const expected = {
      BCH: { denomination: 'ethereum_denomination' },
      BTC: {
        currencyCode: 'BTC',
        currencyName: 'Bitcoin',
        denomination: 'bitcoin_denomination',
        denominations: [
          { multiplier: '100000000', name: 'BTC', symbol: '₿' },
          { multiplier: '100000', name: 'mBTC', symbol: 'm₿' },
          { multiplier: '100', name: 'bits', symbol: 'ƀ' }
        ],
        symbolImage: 'data:image/png;base64,bitcoinsymbolimage=',
        symbolImageDarkMono: 'data:image/png;base64,bitcoinsymbolimagedarkmono'
      },
      DASH: { denomination: '100000000' },
      ETH: {
        currencyCode: 'ETH',
        currencyName: 'Ethereum',
        denomination: '1000000000000000000',
        denominations: [{ multiplier: '1000000000000000000', name: 'ETH', symbol: 'Ξ' }, { multiplier: '1000000000000000', name: 'mETH', symbol: 'mΞ' }],
        symbolImage: 'data:image/png;base64,ethereumsymbolimage==',
        symbolImageDarkMono: 'data:image/png;base64,etheremsymbolimagedarkmono='
      },
      LTC: { denomination: '100000000' },
      REP: {
        currencyCode: 'REP',
        currencyName: 'Augur',
        denomination: '1000000000000000000',
        denominations: [{ multiplier: '1000000000000000000', name: 'REP' }],
        symbolImage: 'data:image/png;base64,repsymbolimage==',
        symbolImageDarkMono: undefined
      },
      WINGS: {
        currencyCode: 'WINGS',
        currencyName: 'Wings',
        denomination: '1000000000000000000',
        denominations: [{ multiplier: '1000000000000000000', name: 'WINGS' }],
        symbolImage: 'data:image/png;base64,wingssymbolimage',
        symbolImageDarkMono: undefined
      },
      account: null,
      autoLogoutTimeInSeconds: 3600,
      bluetoothMode: false,
      changesLocked: true,
      confirmPasswordError: '',
      customTokens: '',
      defaultFiat: 'USD',
      isOtpEnabled: true,
      isTouchEnabled: false,
      isTouchSupported: false,
      loginStatus: true,
      merchantMode: false,
      otpKey: 'my_otp_key',
      otpMode: false,
      otpResetDate: undefined,
      otpResetPending: false,
      pinLoginEnabled: true,
      pinMode: false,
      plugins: {
        arrayPlugins: [bitcoinPlugin, ethereumPlugin],
        bitcoin: bitcoinPlugin,
        ethereum: ethereumPlugin,
        supportedWalletTypes: ['wallet:bitcoin', 'wallet:bitcoin-bip49', 'wallet:bitcoin-bip44', 'wallet:ethereum']
      },
      sendLogsStatus: 'pending'
    }

    const action = {
      type: ACCOUNT_INIT_COMPLETE,
      data: accountInitObject
    }
    const actual = settingsReducer(initialState, action)

    expect(actual).toEqual(expected)
  })

  test('SET_CONFIRM_PASSWORD_ERROR', () => {
    const errorMessage = 'my_error_message'
    const expected = 'my_error_message'
    const action = {
      type: SET_CONFIRM_PASSWORD_ERROR,
      data: {
        confirmPasswordError: errorMessage
      }
    }
    const actual = settingsReducer(initialState, action).confirmPasswordError

    expect(actual).toEqual(expected)
  })

  test('TOGGLE_PIN_LOGIN_ENABLED', () => {
    const expected = true
    const action = togglePinLoginEnabled(true)
    const actual = settingsReducer(initialState, action).pinLoginEnabled

    expect(actual).toEqual(expected)
  })

  test('SET_CUSTOM_TOKENS', () => {
    const tokens = [
      {
        currencyName: 'Bitcoin',
        currencyCode: 'BTC',
        contractAddress: '',
        multiplier: '100000000',
        denomination: '100000000',
        isVisible: true,
        denominations: [{ name: 'Bitcoin', multiplier: '100000000', symbol: 'B' }]
      }
    ]
    const expected = [...tokens]
    const action = setCustomTokens(tokens)
    const actual = settingsReducer(initialState, action).customTokens

    expect(actual).toEqual(expected)
  })

  test('UPDATE_EXISTING_TOKEN_SUCCESS', () => {
    const token = {
      currencyName: 'REP',
      currencyCode: 'REP',
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const updatedToken = {
      currencyName: 'REP',
      currencyCode: 'REP',
      contractAddress: 'my_rep_address',
      multiplier: '999999999',
      denomination: '999999999',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const tokens = [token]
    const setupAction = setCustomTokens(tokens)
    const state = settingsReducer(initialState, setupAction)

    const expected = [updatedToken]
    const action = updateExistingTokenSuccess(updatedToken)
    const actual = settingsReducer(state, action).customTokens

    expect(actual).toEqual(expected)
  })

  test('UPDATE_EXISTING_TOKEN_SUCCESS', () => {
    const token = {
      currencyName: 'REP',
      currencyCode: 'REP',
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const updatedToken = {
      currencyName: 'REP',
      currencyCode: 'REP',
      contractAddress: 'my_rep_address',
      multiplier: '999999999',
      denomination: '999999999',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const tokens = [token]
    const setupAction = setCustomTokens(tokens)
    const state = settingsReducer(initialState, setupAction)

    const expected = updatedToken
    const action = updateExistingTokenSuccess(updatedToken)
    const actual = settingsReducer(state, action)[token.currencyCode]

    expect(actual).toEqual(expected)
  })

  test('DELETE_CUSTOM_TOKEN_SUCCESS', () => {
    const currencyCode = 'REP'
    const token = {
      currencyName: currencyCode,
      currencyCode: currencyCode,
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const tokens = [token]
    const setupAction = setCustomTokens(tokens)
    const state = settingsReducer(initialState, setupAction)

    const expected = false
    const action = deleteCustomTokenSuccess(currencyCode)
    // $FlowExpectedError
    const actual = settingsReducer(state, action)[token.currencyCode].isVisible

    expect(actual).toEqual(expected)
  })

  test('DELETE_CUSTOM_TOKEN_SUCCESS', () => {
    const currencyCode = 'REP'
    const token = {
      currencyName: currencyCode,
      currencyCode: currencyCode,
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }
    const tokens = [token]
    const setupAction = setCustomTokens(tokens)
    const state = settingsReducer(initialState, setupAction)

    const expected = false
    const action = deleteCustomTokenSuccess(currencyCode)
    // $FlowExpectedError
    const actual = settingsReducer(state, action).customTokens.find(customToken => customToken.currencyCode === token.currencyCode).isVisible

    expect(actual).toEqual(expected)
  })

  test('SET_TOKEN_SETTINGS', () => {
    const currencyCode = 'REP'
    const token = {
      currencyName: currencyCode,
      currencyCode: currencyCode,
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }

    const expected = token
    const action = setTokenSettings(token)
    const actual = settingsReducer(initialState, action)[currencyCode]

    expect(actual).toEqual(expected)
  })

  test('ADD_NEW_CUSTOM_TOKEN_SUCCESS', () => {
    const walletId = 'my_first_wallet_id'
    const currencyCode = 'REP'
    const enabledTokens = []
    const settings = {}
    const token = {
      currencyName: currencyCode,
      currencyCode: currencyCode,
      contractAddress: 'my_rep_address',
      multiplier: '100000000',
      denomination: '100000000',
      isVisible: true,
      denominations: [{ name: 'REP', multiplier: '100000000', symbol: 'R' }]
    }

    const expected = token
    const action = addNewTokenSuccess(walletId, token, settings, enabledTokens)
    const actual = settingsReducer(initialState, action)[currencyCode]

    expect(actual).toEqual(expected)
  })

  test('SET_DENOMINATION_KEY', () => {
    const currencyCode = 'REP'
    const denominationKey = '100000'

    const expected = denominationKey
    const action = setDenominationKey(currencyCode, denominationKey)
    const actual = settingsReducer(initialState, action)[currencyCode].denomination

    expect(actual).toEqual(expected)
  })

  test('UPDATE_SETTINGS', () => {
    const settings = { a: 123 }

    const expected = settings
    const action = updateSettings(settings)
    const actual = settingsReducer(initialState, action)

    expect(actual).toEqual(expected)
  })

  test('LOAD_SETTINGS', () => {
    const settings = { a: 123 }

    const expected = settings
    const action = loadSettings(settings)
    const actual = settingsReducer(initialState, action)

    expect(actual).toEqual(expected)
  })

  test('SET_PIN_MODE', () => {
    const pinMode = false

    const expected = pinMode
    const action = setPINMode(pinMode)
    const actual = settingsReducer(initialState, action).pinMode

    expect(actual).toEqual(expected)
  })

  test('SET_OTP_MODE', () => {
    const otpMode = false

    const expected = otpMode
    const action = setOTPMode(otpMode)
    const actual = settingsReducer(initialState, action).otpMode

    expect(actual).toEqual(expected)
  })

  test('SET_AUTO_LOGOUT_TIME', () => {
    const autoLogoutTimeInSeconds = 12345

    const expected = autoLogoutTimeInSeconds
    const action = setAutoLogoutTimeInSeconds(autoLogoutTimeInSeconds)
    const actual = settingsReducer(initialState, action).autoLogoutTimeInSeconds

    expect(actual).toEqual(expected)
  })

  test('SET_DEFAULT_FIAT', () => {
    const defaultFiat = 'JPY'

    const expected = defaultFiat
    const action = setDefaultFiat(defaultFiat)
    const actual = settingsReducer(initialState, action).defaultFiat

    expect(actual).toEqual(expected)
  })

  test('SET_MERCHANT_MODE', () => {
    const merchantMode = true

    const expected = merchantMode
    const action = setMerchantMode(merchantMode)
    const actual = settingsReducer(initialState, action).merchantMode

    expect(actual).toEqual(expected)
  })

  test('SET_BLUETOOTH_MODE', () => {
    const bluetoothMode = true

    const expected = bluetoothMode
    const action = setBluetoothMode(bluetoothMode)
    const actual = settingsReducer(initialState, action).bluetoothMode

    expect(actual).toEqual(expected)
  })

  test('SET_BITCOIN_OVERRIDE_SERVER', () => {
    const overrideServer = 'https://www.google.com'

    const expected = overrideServer
    const action = setBitcoinOverrideServer(overrideServer)
    // $FlowFixMe
    const actual = settingsReducer(initialState, action)['BTC'].overrideServer

    expect(actual).toEqual(expected)
  })

  test('SET_SETTINGS_LOCK', () => {
    const changesLocked = false

    const expected = changesLocked
    const action = setSettingsLock(changesLocked)
    const actual = settingsReducer(initialState, action).changesLocked

    expect(actual).toEqual(expected)
  })

  test('SET_OTP_SETTINGS', () => {
    const otpSettings = {
      enabled: true,
      otpKey: 'qweqwe',
      otpResetPending: false
    }

    const expected = {
      isOtpEnabled: true,
      otpKey: 'qweqwe',
      otpResetPending: false
    }
    const action = updateOtpInfo(otpSettings)
    const actual = {
      isOtpEnabled: settingsReducer(initialState, action).isOtpEnabled,
      otpKey: settingsReducer(initialState, action).otpKey,
      otpResetPending: settingsReducer(initialState, action).otpResetPending
    }

    expect(actual).toEqual(expected)
  })

  test('TOUCH_ID_SETTINGS', () => {
    const touchIdInfo = {
      isTouchEnabled: true,
      isTouchSupported: true
    }

    const expected = touchIdInfo
    const action = addTouchIdInfo(touchIdInfo)
    const actual = {
      isTouchEnabled: settingsReducer(initialState, action).isTouchEnabled,
      isTouchSupported: settingsReducer(initialState, action).isTouchSupported
    }

    expect(actual).toEqual(expected)
  })

  test('CHANGE_TOUCH_ID_SETTINGS', () => {
    const touchIdIsEnabled = false

    const expected = touchIdIsEnabled
    const action = updateTouchIdEnabled(touchIdIsEnabled)

    const actual = settingsReducer(initialState, action).isTouchEnabled

    expect(actual).toEqual(expected)
  })

  test('ADD_CURRENCY_PLUGIN', () => {
    const touchIdIsEnabled = false

    const expected = touchIdIsEnabled
    const action = updateTouchIdEnabled(touchIdIsEnabled)

    const actual = settingsReducer(initialState, action).isTouchEnabled

    expect(actual).toEqual(expected)
  })
})

// TODO:
// WALLET_ACTION.OVERWRITE_THEN_DELETE_TOKEN_SUCCESS
// WALLET_ACTION.ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS
