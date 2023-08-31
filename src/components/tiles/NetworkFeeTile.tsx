import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useFiatText } from '../../hooks/useFiatText'
import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCryptoText } from '../../util/cryptoTextUtils'
import { getDenomFromIsoCode } from '../../util/utils'
import { Tile } from './Tile'

// TODO: Integrate into SendScene, FlipInputModal, and AdvancedDetailsModal
export const NetworkFeeTile = (props: { wallet: EdgeCurrencyWallet; nativeAmount: string }) => {
  const {
    wallet: {
      currencyInfo: { pluginId, currencyCode },
      fiatCurrencyCode: isoFiatCurrencyCode
    },
    nativeAmount
  } = props

  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`])

  const exchangeDenominationMultiplier = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).multiplier)
  const exchangeDenominationName = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).name)
  const exchangeDenominationSymbol = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).symbol ?? '')

  const displayDenominationMultiplier = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).multiplier)
  const displayDenominationName = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).name)
  const displayDenominationSymbol = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).symbol ?? '')

  const feeCryptoAmount = getCryptoText({
    displayDenomination: {
      multiplier: displayDenominationMultiplier,
      name: displayDenominationName,
      symbol: displayDenominationSymbol
    },
    exchangeDenomination: {
      multiplier: exchangeDenominationMultiplier,
      name: exchangeDenominationName,
      symbol: exchangeDenominationSymbol
    },
    fiatDenomination,
    exchangeRate,
    nativeAmount: nativeAmount
  })

  const feeFiatAmount = useFiatText({
    appendFiatCurrencyCode: false,
    autoPrecision: true,
    cryptoCurrencyCode: currencyCode,
    cryptoExchangeMultiplier: exchangeDenominationMultiplier,
    fiatSymbolSpace: true,
    isoFiatCurrencyCode,
    nativeCryptoAmount: nativeAmount
  })

  const title = lstrings.loan_estimate_fee
  const body = `${feeCryptoAmount} (${feeFiatAmount})`

  return <Tile type="static" title={title} body={body} />
}
