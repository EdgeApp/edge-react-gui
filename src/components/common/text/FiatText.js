// @flow

import { useFiatText } from '../../../hooks/useFiatText'

/**
 * - raw: Only the numeric fiat text itself
 * - primary: Fiat text with the fiat symbol
 * - secondary: Fiat text enclosed in parenthesis, used when the fiat text is
 * combined with a crypto amount
 **/
export type FiatTextFormat = 'raw' | 'primary' | 'secondary'

type Props = {
  format: FiatTextFormat,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  cryptoExchangeMultiplier: string,
  isoFiatCurrencyCode: string
}

export const FiatText = ({ format, nativeCryptoAmount, cryptoCurrencyCode, cryptoExchangeMultiplier, isoFiatCurrencyCode }: Props) => {
  return useFiatText({
    nativeCryptoAmount,
    cryptoCurrencyCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier,
    autoPrecision: format === 'primary',
    parenthesisEnclosed: format === 'secondary'
  }).fiatString
}
