// @flow

import { useCryptoText } from '../../../hooks/useCryptoText'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { fixFiatCurrencyCode, getDenomFromIsoCode, zeroString } from '../../../util/utils'

type Props = {
  walletId: string,
  tokenId?: string,
  nativeAmount?: string
}

/**
 * Returns a cleaned crypto amount string. If no nativeAmount is given, use the
 * wallet balance.
 **/
export const CryptoText = ({ walletId, tokenId, nativeAmount }: Props) => {
  const dispatch = useDispatch()
  const currencyInfo = useSelector(state => state.core.account.currencyWallets[walletId].currencyInfo)
  const fiatCurrencyCode = useSelector(state => state.core.account.currencyWallets[walletId].fiatCurrencyCode)
  const tokenOrNativeCode = tokenId ?? currencyInfo.currencyCode
  const exchangeRates = useSelector(state => state.exchangeRates)
  const nativeAmountOrBalance = useSelector(state => nativeAmount ?? state.core.account.currencyWallets[walletId].balances[tokenOrNativeCode] ?? '0')

  // Crypto Amount And Exchange Rate
  const denomination = dispatch(getDisplayDenominationFromState(currencyInfo.pluginId, tokenOrNativeCode))
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, tokenOrNativeCode))
  const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const rateKey = `${tokenOrNativeCode}_${isoFiatCurrencyCode}`
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : '1'

  return useCryptoText({
    nativeAmount: nativeAmountOrBalance,
    exchangeRate,
    exchangeDenomination,
    fiatDenomination,
    denomination,
    currencyCode: tokenOrNativeCode
  })
}
