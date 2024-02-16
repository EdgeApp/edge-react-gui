import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useFiatText } from '../../hooks/useFiatText'
import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCryptoText } from '../../util/cryptoTextUtils'
import { getDenomFromIsoCode } from '../../util/utils'
import { RowUi4 } from '../ui4/RowUi4'

interface Props {
  wallet: EdgeCurrencyWallet
  nativeAmount: string
}

// TODO: Integrate into SendScene, FlipInputModal, and AdvancedDetailsModal
export const NetworkFeeTile = (props: Props) => {
  const { wallet, nativeAmount } = props
  const {
    currencyConfig,
    currencyInfo: { pluginId, currencyCode },
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`])

  const exchangeDenominationMultiplier = getExchangeDenomByCurrencyCode(currencyConfig, currencyCode).multiplier
  const exchangeDenominationName = getExchangeDenomByCurrencyCode(currencyConfig, currencyCode).name
  const exchangeDenominationSymbol = getExchangeDenomByCurrencyCode(currencyConfig, currencyCode).symbol ?? ''

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

  return <RowUi4 title={title} body={body} />
}
