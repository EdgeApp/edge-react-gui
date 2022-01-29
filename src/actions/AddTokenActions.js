// @flow

import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import { getSyncedSettings, setSyncedSettings } from '../modules/Core/Account/settings'
import { setEnabledTokens } from '../modules/Core/Wallets/EnabledTokens.js'
import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import type { CustomTokenInfo } from '../types/types.js'
import { mergeTokens } from '../util/utils.js'
import { assembleCustomToken, refreshWallet } from './WalletActions.js'

export const addNewToken = (
  walletId: string,
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  denomination: string,
  walletType: string
) => {
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
        dispatch(refreshWallet(walletId))
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
  state: RootState
) => {
  const { account } = state.core
  const { currencyWallets } = account

  const uiWallet = state.ui.wallets.byId[walletId]
  // create modified object structure to match metaTokens
  const newTokenObj: CustomTokenInfo = assembleCustomToken(currencyName, currencyCode, contractAddress, denomination, uiWallet.type)

  // Check for conflicting currency codes:
  if (currencyCode === currencyWallets[walletId].currencyInfo.currencyCode) throw new Error(sprintf(s.strings.error_token_exists, currencyCode))

  const coreWallet = currencyWallets[walletId]
  await coreWallet.addCustomToken(newTokenObj)
  coreWallet.enableTokens([currencyCode])
  const settingsOnFile = await getSyncedSettings(account)

  const setSettings = settingsOnFile
  const customTokens = settingsOnFile.customTokens
  let newCustomTokens = []
  if (!customTokens || customTokens.length === 0) {
    // if customTokens array is empty
    newCustomTokens = [newTokenObj]
  } else {
    const newList: CustomTokenInfo[] = [newTokenObj]
    newCustomTokens = mergeTokens(newList, customTokens) // otherwise merge metaTokens and customTokens
  }
  settingsOnFile.customTokens = newCustomTokens
  if (settingsOnFile.denominationSettings?.[coreWallet.currencyInfo.pluginId] != null) {
    settingsOnFile.denominationSettings[coreWallet.currencyInfo.pluginId][currencyCode] = newTokenObj
  }

  await setSyncedSettings(account, settingsOnFile)
  const newEnabledTokens = uiWallet.enabledTokens
  if (uiWallet.enabledTokens.indexOf(newTokenObj.currencyCode) === -1) {
    newEnabledTokens.push(newTokenObj.currencyCode)
  }
  await setEnabledTokens(coreWallet, newEnabledTokens)
  return { walletId, newTokenObj, setSettings, enabledTokensOnWallet: newEnabledTokens }
}
