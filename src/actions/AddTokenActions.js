// @flow

import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import * as SETTINGS_API from '../modules/Core/Account/settings'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { setEnabledTokens } from '../modules/Core/Wallets/EnabledTokens.js'
import * as UI_WALLET_SELECTORS from '../modules/UI/selectors.js'
import type { Dispatch, GetState, State } from '../types/reduxTypes.js'
import type { CustomTokenInfo } from '../types/types.js'
import * as UTILS from '../util/utils.js'
import * as WALLET_ACTIONS from './WalletActions.js'

export const addNewToken = (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: 'ADD_TOKEN_START' })
    const state = getState()
    addTokenAsync(walletId, currencyName, currencyCode, contractAddress, denomination, state)
      .then(addedWalletInfo => {
        const { walletId, newTokenObj, setSettings, enabledTokensOnWallet } = addedWalletInfo
        newTokenObj.walletType = walletType
        dispatch({
          type: 'ADD_NEW_CUSTOM_TOKEN_SUCCESS',
          data: {
            walletId,
            tokenObj: newTokenObj,
            settings: setSettings,
            enabledTokens: enabledTokensOnWallet
          }
        })
        dispatch(WALLET_ACTIONS.refreshWallet(walletId))
        Actions.pop()
      })
      .catch(error => {
        showError(error)
        dispatch({ type: 'ADD_NEW_CUSTOM_TOKEN_FAILURE' })
      })
  }
}

export const addTokenAsync = async (
  walletId: string,
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  denomination: string,
  state: State
) => {
  const uiWallet = UI_WALLET_SELECTORS.getWallet(state, walletId)
  // create modified object structure to match metaTokens
  const newTokenObj: CustomTokenInfo = WALLET_ACTIONS.assembleCustomToken(currencyName, currencyCode, contractAddress, denomination, uiWallet.type)
  const account = CORE_SELECTORS.getAccount(state)

  // Check for conflicting currency codes:
  const { currencyConfig } = account
  for (const pluginName in currencyConfig) {
    const { currencyInfo } = currencyConfig[pluginName]
    if (currencyCode === currencyInfo.currencyCode) {
      throw new Error(sprintf(s.strings.error_token_exists, currencyCode))
    }
  }

  const uiWallet = UI_WALLET_SELECTORS.getWallet(state, walletId)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)
  await coreWallet.addCustomToken(newTokenObj)
  coreWallet.enableTokens([currencyCode])
  const settingsOnFile = await SETTINGS_API.getSyncedSettingsAsync(account)

  const setSettings = settingsOnFile
  const customTokens = settingsOnFile.customTokens
  let newCustomTokens = []
  if (!customTokens || customTokens.length === 0) {
    // if customTokens array is empty
    newCustomTokens = [newTokenObj]
  } else {
    newCustomTokens = UTILS.mergeTokens([newTokenObj], customTokens) // otherwise merge metaTokens and customTokens
  }
  settingsOnFile.customTokens = newCustomTokens
  settingsOnFile[currencyCode] = newTokenObj
  await SETTINGS_API.setSyncedSettingsAsync(account, settingsOnFile)
  const newEnabledTokens = uiWallet.enabledTokens
  if (uiWallet.enabledTokens.indexOf(newTokenObj.currencyCode) === -1) {
    newEnabledTokens.push(newTokenObj.currencyCode)
  }
  await setEnabledTokens(coreWallet, newEnabledTokens)
  return { walletId, newTokenObj, setSettings, enabledTokensOnWallet: newEnabledTokens }
}
