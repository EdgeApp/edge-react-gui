import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useFiatText } from '../../hooks/useFiatText'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCryptoText } from '../../util/cryptoTextUtils'
import { getDenomFromIsoCode } from '../../util/utils'
import { EdgeRow } from '../rows/EdgeRow'

interface Props {
  wallet: EdgeCurrencyWallet
  nativeAmount: string
}

// TODO: Integrate into SendScene, FlipInputModal, and AdvancedDetailsModal
export const NetworkFeeTile = (props: Props) => {
  const { wallet, nativeAmount } = props
  const {
    currencyConfig,
    currencyInfo: { currencyCode }
  } = wallet

  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  const fiatDenomination = getDenomFromIsoCode(defaultIsoFiat)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${defaultIsoFiat}`])

  const exchangeDenominationMultiplier = getExchangeDenom(currencyConfig, null).multiplier
  const exchangeDenominationName = getExchangeDenom(currencyConfig, null).name
  const exchangeDenominationSymbol = getExchangeDenom(currencyConfig, null).symbol ?? ''

  const displayDenominationMultiplier = useDisplayDenom(currencyConfig, null).multiplier
  const displayDenominationName = useDisplayDenom(currencyConfig, null).name
  const displayDenominationSymbol = useDisplayDenom(currencyConfig, null).symbol ?? ''

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
    isoFiatCurrencyCode: defaultIsoFiat,
    nativeCryptoAmount: nativeAmount
  })

  const title = lstrings.loan_estimate_fee
  const body = `${feeCryptoAmount} (${feeFiatAmount})`

  return <EdgeRow title={title} body={body} />
}
