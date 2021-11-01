// @flow
import { FIAT_PRECISION } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { getFiatSymbol } from '../../util/utils.js'

type Props = {
  appendFiatCurrencyCode?: boolean,
  cryptoAmount: string | number,
  cryptoCurrencyCode: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode: string,
  parenthesisEnclosed?: boolean
}

export const FiatText = (props: Props) => {
  const { appendFiatCurrencyCode, fiatSymbolSpace, isoFiatCurrencyCode, parenthesisEnclosed } = props
  const fiatAmountStr = useSelector(state => {
    const { cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount } = props
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, String(cryptoAmount))
  })

  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  const fiatSymbol = getFiatSymbol(isoFiatCurrencyCode)
  const fiatSymbolFmt = fiatSymbolSpace ? ` ${fiatSymbol}` : fiatSymbol
  const fiatAmountFmtStr = formatNumber(fiatAmountStr, { toFixed: FIAT_PRECISION })
  const openParen = parenthesisEnclosed ? '(' : ''
  const closeParen = parenthesisEnclosed ? ')' : ''

  return `${openParen}${fiatSymbolFmt}${fiatAmountFmtStr}${fiatCurrencyCode}${closeParen}`
}
