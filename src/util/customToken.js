// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { MismatchTokenParamsModal } from '../components/modals/MismatchTokenParamsModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import type { CustomTokenInfo, GuiWallet } from '../types/types'

export const MISMATCH_ERROR = 'MismatchNotConfirmed'

export const createValidation = async (
  wallet: GuiWallet,
  currentCustomTokens: CustomTokenInfo[],
  currencyWallet: EdgeCurrencyWallet,
  fieldsMap: { currencyName: string, currencyCode: string, decimalPlaces: string, contractAddress: string }
) => {
  const { currencyName, currencyCode, decimalPlaces, contractAddress } = fieldsMap
  const currentCustomTokenIndex = currentCustomTokens.findIndex(item => item.currencyCode === currencyCode)
  const metaTokensIndex = wallet.metaTokens.findIndex(item => item.currencyCode === currencyCode)

  // if token is hard-coded into wallets of this type
  if (metaTokensIndex >= 0) throw new Error(s.strings.manage_tokens_duplicate_currency_code)

  // if that token already exists and is visible (ie not deleted)
  if (currentCustomTokenIndex >= 0 && currentCustomTokens[currentCustomTokenIndex].isVisible) {
    throw new Error(s.strings.manage_tokens_duplicate_currency_code)
  } else if (!currencyName || !currencyCode || !decimalPlaces || !contractAddress) {
    throw new Error(s.strings.addtoken_invalid_information)
  } else {
    let tokenInfo = null

    if (currencyWallet.otherMethods.getTokenInfo != null) {
      tokenInfo = await currencyWallet.otherMethods.getTokenInfo(currencyCode)
    }

    if (tokenInfo == null) {
      const isConfirm = await Airship.show(bridge => <MismatchTokenParamsModal bridge={bridge} />)

      if (!isConfirm) throw new Error(MISMATCH_ERROR)
    }
  }
}
