// @flow

import { useFiatText } from '../../../hooks/useFiatText'
import { getDenominationFromCurrencyInfo } from '../../../selectors/DenominationSelectors'
import { useSelector } from '../../../types/reactRedux'
import { fixFiatCurrencyCode } from '../../../util/utils'

/**
 * - raw: Only the numeric fiat text itself
 * - primary: Fiat text with the fiat symbol
 * - secondary: Fiat text enclosed in parenthesis, used when the fiat text is
 * combined with a crypto amount
 **/
export type FiatTextFormat = 'raw' | 'primary' | 'secondary'

type Props = {
  walletId: string,
  tokenId?: string,
  nativeCryptoAmount: string,
  format: FiatTextFormat
}

/**
 * Return a formatted fiat text string representing the exchange rate of a
 * specific crypto asset and native amount.
 **/
export const FiatText = ({ walletId, tokenId, nativeCryptoAmount, format }: Props) => {
  const fiatCurrencyCode = useSelector(state => state.core.account.currencyWallets[walletId].fiatCurrencyCode)
  const currencyInfo = useSelector(state => state.core.account.currencyWallets[walletId].currencyInfo)
  const tokenOrNativeCode = tokenId ?? currencyInfo.currencyCode
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const { multiplier: cryptoExchangeMultiplier } = getDenominationFromCurrencyInfo(currencyInfo, tokenOrNativeCode)

  return useFiatText({
    nativeCryptoAmount,
    cryptoCurrencyCode: tokenOrNativeCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier,
    autoPrecision: format === 'primary',
    parenthesisEnclosed: format === 'secondary'
  }).fiatString
}
