// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { useWatchAccount } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'

type Props = {
  appendFiatCurrencyCode?: boolean,
  autoPrecision?: boolean,
  currencyCode?: string,
  fiatSymbolSpace?: boolean,
  nativeCryptoAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet
}

/**
 * Return a formatted fiat text string representing the exchange rate of a
 * specific crypto asset and native amount.
 **/
export const FiatText = ({ appendFiatCurrencyCode, autoPrecision, currencyCode, fiatSymbolSpace, nativeCryptoAmount, tokenId, wallet }: Props) => {
  const account = useSelector(state => state.core.account)
  const currencyConfigMap = useWatchAccount(account, 'currencyConfig')
  const {
    currencyCode: derivedCurrencyCode,
    denomination,
    isoFiatCurrencyCode
  } = useTokenDisplayData({
    currencyConfigMap,
    tokenId,
    wallet
  })

  return useFiatText({
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode: currencyCode ?? derivedCurrencyCode,
    cryptoExchangeMultiplier: denomination.multiplier,
    fiatSymbolSpace,
    isoFiatCurrencyCode,
    nativeCryptoAmount
  })
}
