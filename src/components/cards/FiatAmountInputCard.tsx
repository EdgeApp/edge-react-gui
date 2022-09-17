import { div, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { formatFiatString } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { truncateDecimals } from '../../locales/intl'
import { useMemo, useState } from '../../types/reactHooks'
import { DECIMAL_PRECISION } from '../../util/utils'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship } from '../services/AirshipInstance'
import { UnderlinedNumInputCard } from './UnderlinedNumInputCard'

type Props = {
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
  const [fiatAmount, setFiatAmount] = useState('0')

  const { assetToFiatRate: destToFiatRate } = useTokenDisplayData({ tokenId, wallet: wallet })
  const {
    currencyConfig: { allTokens }
  } = wallet

  // Convert amount fiat -> amount crypto, notify caller
  const token = tokenId != null ? allTokens[tokenId] : null
  const { denominations: destDenoms } = token != null ? token : wallet.currencyInfo
  const destExchangeMultiplier = destDenoms == null ? '0' : destDenoms[0].multiplier

  const nativeCryptoAmount = truncateDecimals(
    destToFiatRate == null || destToFiatRate === '0' ? '0' : mul(destExchangeMultiplier, div(fiatAmount ?? '0', destToFiatRate, DECIMAL_PRECISION)),
    0
  )

  onAmountChanged(fiatAmount, nativeCryptoAmount)

  const handleEditActionfiatAmount = React.useCallback(() => {
    Airship.show<string | undefined>(bridge => <TextInputModal title={title} message={inputModalMessage} bridge={bridge} keyboardType="decimal-pad" />).then(
      inputAmount => {
        if (inputAmount != null) {
          setFiatAmount(inputAmount)
        }
      }
    )
  }, [inputModalMessage, title])

  const formattedFiatAmount = useMemo(() => formatFiatString({ fiatAmount: fiatAmount ?? '0', autoPrecision: true }), [fiatAmount])

  return (
    <UnderlinedNumInputCard currencyCode="USD" formattedAmount={formattedFiatAmount} iconUri={iconUri} title={title} onPress={handleEditActionfiatAmount} />
  )
}

export const FiatAmountInputCard = React.memo(FiatAmountInputCardComponent)
