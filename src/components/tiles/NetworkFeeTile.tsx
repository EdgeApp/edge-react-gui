import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useFiatText } from '../../hooks/useFiatText'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCryptoText } from '../../util/cryptoTextUtils'
import { getDenomFromIsoCode } from '../../util/utils'
import { EdgeRow } from '../rows/EdgeRow'

interface Props {
  wallet: EdgeCurrencyWallet
  nativeAmount: string
}

// TODO: Integrate into SendScene, FlipInputModal, and AdvancedDetailsModal
export const NetworkFeeTile: React.FC<Props> = props => {
  const { wallet, nativeAmount } = props
  const { currencyConfig } = wallet

  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  const fiatDenomination = getDenomFromIsoCode(defaultIsoFiat)
  const exchangeRate = useSelector(state =>
    getExchangeRate(
      state.exchangeRates,
      wallet.currencyInfo.pluginId,
      null,
      defaultIsoFiat
    )
  )

  const exchangeDenominationMultiplier = getExchangeDenom(
    currencyConfig,
    null
  ).multiplier
  const exchangeDenominationName = getExchangeDenom(currencyConfig, null).name
  const exchangeDenominationSymbol =
    getExchangeDenom(currencyConfig, null).symbol ?? ''

  const displayDenominationMultiplier = useDisplayDenom(
    currencyConfig,
    null
  ).multiplier
  const displayDenominationName = useDisplayDenom(currencyConfig, null).name
  const displayDenominationSymbol =
    useDisplayDenom(currencyConfig, null).symbol ?? ''

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
    nativeAmount
  })

  const feeFiatAmount = useFiatText({
    cryptoExchangeMultiplier: exchangeDenominationMultiplier,
    isoFiatCurrencyCode: defaultIsoFiat,
    nativeCryptoAmount: nativeAmount,
    pluginId: wallet.currencyInfo.pluginId,
    tokenId: null,

    appendFiatCurrencyCode: false,
    autoPrecision: true,
    fiatSymbolSpace: true,
    displayZeroAsInteger: false
  })

  const title = lstrings.loan_estimate_fee
  const body = `${feeCryptoAmount} (${feeFiatAmount})`

  return <EdgeRow title={title} body={body} />
}
