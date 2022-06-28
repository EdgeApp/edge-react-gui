// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useCryptoText } from '../../hooks/useCryptoText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { EdgeText } from '../themed/EdgeText'

type Props = {|
  nativeAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,
  withSymbol?: boolean
|}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 **/
export const CryptoText = ({ wallet, tokenId, nativeAmount, withSymbol }: Props) => {
  const {
    denomination: exchangeDenomination,
    fiatDenomination,
    assetToFiatRate,
    currencyCode
  } = useTokenDisplayData({
    tokenId,
    wallet
  })
  const state = useSelector(state => state)
  const displayDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, exchangeDenomination.name ?? wallet.currencyInfo.currencyCode)

  const cryptoText = useCryptoText({
    displayDenomination,
    exchangeDenomination,
    exchangeRate: assetToFiatRate,
    fiatDenomination,
    nativeAmount,
    currencyCode: withSymbol ? undefined : currencyCode
  })

  return <EdgeText>{cryptoText}</EdgeText>
}
