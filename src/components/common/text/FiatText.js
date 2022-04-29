// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useFiatText } from '../../../hooks/useFiatText'
import { useSelector } from '../../../types/reactRedux'
import { getAllTokens, guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { fixFiatCurrencyCode } from '../../../util/utils'

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
  const currencyInfo = wallet.currencyInfo
  const pluginId = currencyInfo.pluginId
  const nativeCurrencyCode = currencyInfo.currencyCode

  let cryptoCurrencyCode, cryptoExchangeMultiplier
  if (nativeCurrencyCode === currencyCode) {
    cryptoCurrencyCode = nativeCurrencyCode
    cryptoExchangeMultiplier = currencyInfo.denominations[0].multiplier
  } else if (tokenId != null) {
    const token = getAllTokens(account.currencyConfig[pluginId])[tokenId]
    cryptoCurrencyCode = token.currencyCode
    cryptoExchangeMultiplier = token.denominations[0].multiplier
  } else if (currencyCode != null) {
    cryptoCurrencyCode = currencyCode

    // HACK: Maintain backwards compatibility
    const guessedToken = guessFromCurrencyCode(account, { currencyCode, pluginId, tokenId })
    const guessedTokenId = guessedToken.tokenId
    if (!guessedTokenId)
      throw new Error(`Could not guess tokenId from: ${JSON.stringify({ currencyCode: currencyCode, pluginId: pluginId, tokenId: tokenId }, null, 2)}`)

    const tokens = getAllTokens(account.currencyConfig[pluginId])
    const token = tokens[guessedTokenId]
    cryptoExchangeMultiplier = token.denominations[0].multiplier
  } else {
    throw new Error('FiatText requires either a tokenId or a currencyCode')
  }
  const isoFiatCurrencyCode = fixFiatCurrencyCode(wallet.fiatCurrencyCode)

  return useFiatText({
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode,
    cryptoExchangeMultiplier,
    fiatSymbolSpace,
    isoFiatCurrencyCode,
    nativeCryptoAmount
  })
}
