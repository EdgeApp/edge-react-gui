import { div, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../util/utils'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship } from '../services/AirshipInstance'
import { sanitizeDecimalAmount } from '../themed/FlipInput'
import { UnderlinedNumInputCard } from './UnderlinedNumInputCard'

interface Props {
  wallet: EdgeCurrencyWallet
  iconUri: string
  inputModalMessage: string
  title: string
  tokenId?: string
  onAmountChanged: (fiatAmount: string, nativeCryptoAmount: string) => void
}

/**
 * An extension of UnderlinedNumInputCard specific to the use case of displaying
 * and taking fiat as an input, and returns the result in both fiat and crypto,
 * based on the given wallet.
 */
const FiatAmountInputCardComponent = ({ wallet, iconUri, inputModalMessage, title, tokenId, onAmountChanged }: Props) => {
  const [sanitizedFiatAmount, setSanitizedFiatAmount] = React.useState('0')

  const { assetToFiatRate: destToFiatRate } = useTokenDisplayData({ tokenId, wallet: wallet })
  const {
    currencyConfig: { allTokens }
  } = wallet

  // TODO: Exchange rate conversions not be handled here. Callers should handle
  // currency conversions elsewhere.
  // Convert amount fiat -> amount crypto, notify caller
  const [nativeCryptoAmount, setNativeCryptoAmount] = React.useState<string>('0')

  React.useEffect(() => {
    const token = tokenId != null ? allTokens[tokenId] : null
    const { denominations: destDenoms } = token != null ? token : wallet.currencyInfo
    const destExchangeMultiplier = destDenoms == null ? '0' : destDenoms[0].multiplier

    // Clean localized fiat amount prior to biggystring ops
    const calculatedNativeCryptoAmount = truncateDecimals(
      destToFiatRate == null || destToFiatRate === '0' ? '0' : mul(destExchangeMultiplier, div(sanitizedFiatAmount ?? '0', destToFiatRate, DECIMAL_PRECISION)),
      0
    )

    setNativeCryptoAmount(calculatedNativeCryptoAmount)
    if (!zeroString(calculatedNativeCryptoAmount) && !zeroString(sanitizedFiatAmount)) onAmountChanged(sanitizedFiatAmount, calculatedNativeCryptoAmount)
  }, [allTokens, destToFiatRate, sanitizedFiatAmount, onAmountChanged, tokenId, wallet.currencyInfo])

  const handleEditActionfiatAmount = useHandler(async () => {
    await Airship.show<string | undefined>(bridge => (
      <TextInputModal title={title} message={inputModalMessage} bridge={bridge} keyboardType="decimal-pad" />
    )).then(inputAmount => {
      if (inputAmount != null) {
        const sanitizedInputAmount = sanitizeDecimalAmount(inputAmount, 2)
        if (!zeroString(sanitizedInputAmount)) {
          setSanitizedFiatAmount(sanitizedInputAmount)
          onAmountChanged(sanitizedInputAmount, nativeCryptoAmount)
        }
      }
    })
  })

  const formattedFiatAmount = React.useMemo(
    () => formatFiatString({ fiatAmount: sanitizedFiatAmount ?? '0', autoPrecision: true, maxPrecision: 2 }),

    [sanitizedFiatAmount]
  )

  return (
    <UnderlinedNumInputCard currencyCode="USD" formattedAmount={formattedFiatAmount} iconUri={iconUri} title={title} onPress={handleEditActionfiatAmount} />
  )
}

export const FiatAmountInputCard = React.memo(FiatAmountInputCardComponent)
