import { abs, div } from 'biggystring'
import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'

import { MAX_CRYPTO_AMOUNT_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { formatNumber, trimEnd } from '../../locales/intl'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { DECIMAL_PRECISION } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeRow, type RowActionIcon } from '../rows/EdgeRow'
import { EdgeText } from '../themed/EdgeText'

// TODO: Check contentPadding

interface Props {
  denomination: EdgeDenomination
  maxCryptoChars?: number
  nativeCryptoAmount: string
  title: string
  currencyConfig: EdgeCurrencyConfig
  tokenId: EdgeTokenId
  type?: RowActionIcon
  onPress?: () => Promise<void> | void
}

export const CryptoFiatAmountTile: React.FC<Props> = (props: Props) => {
  const {
    denomination,
    maxCryptoChars = MAX_CRYPTO_AMOUNT_CHARACTERS,
    nativeCryptoAmount,
    title,
    currencyConfig,
    tokenId,
    type = 'none',
    onPress
  } = props

  const { name: cryptoName, multiplier: cryptoDenomMult } = denomination

  // Resolve iso fiat currency code for fiat formatting
  const { isoFiatCurrencyCode } = useTokenDisplayData({
    tokenId,
    currencyConfig
  })

  // Convert the native amount to the denomination the caller wants shown,
  // which may be a display denomination such as sats or mETH:
  const cryptoAmountDenom = div(
    nativeCryptoAmount,
    cryptoDenomMult,
    DECIMAL_PRECISION
  )

  // Default to 10 displayed chars for crypto amount
  const fmtCryptoAmount = trimEnd(
    formatNumber(cryptoAmountDenom, {
      toFixed: maxCryptoChars
    })
  )
  const cryptoAmountText = `${fmtCryptoAmount} ${cryptoName} `

  // Fiat amount is always positive for this specific tile
  const absCryptoAmount = abs(nativeCryptoAmount)

  // Precompute fiat string for inline display. Rates are per exchange unit,
  // so this ignores the denomination shown above.
  const fiatText = useFiatText({
    nativeCryptoAmount: absCryptoAmount,
    tokenId,
    pluginId: currencyConfig.currencyInfo.pluginId,
    cryptoExchangeMultiplier: getExchangeDenom(currencyConfig, tokenId)
      .multiplier,
    isoFiatCurrencyCode
  })

  return (
    <EdgeCard>
      <EdgeRow rightButtonType={type} title={title} onPress={onPress}>
        <EdgeText>
          {cryptoAmountText}
          {`(${fiatText})`}
        </EdgeText>
      </EdgeRow>
    </EdgeCard>
  )
}
