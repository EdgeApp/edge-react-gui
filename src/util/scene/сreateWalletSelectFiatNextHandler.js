// @flow

import { Alert } from 'react-native'

import { CREATE_WALLET_ACCOUNT_SETUP, CREATE_WALLET_NAME } from '../../constants/SceneKeys'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import { Actions } from '../../types/routerTypes'
import type { CreateWalletType, GuiFiatType } from '../../types/types'

export const сreateWalletSelectFiatNextHandler = (
  isValidFiatType: boolean,
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string
) => {
  if (!isValidFiatType) return Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_fiat)

  // check if account-based or not
  const specialCurrencyInfo = getSpecialCurrencyInfo(selectedWalletType.currencyCode)
  // check if eos-like
  let nextSceneKey = CREATE_WALLET_NAME

  if (!specialCurrencyInfo.needsAccountNameSetup || cleanedPrivateKey) {
    nextSceneKey = CREATE_WALLET_NAME
  } else {
    nextSceneKey = CREATE_WALLET_ACCOUNT_SETUP
  }

  Actions.push(nextSceneKey, {
    selectedFiat,
    selectedWalletType,
    cleanedPrivateKey
  })
}
