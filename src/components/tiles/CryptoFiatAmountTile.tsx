/* eslint-disable react-native/no-raw-text */
import { abs, div } from 'biggystring'
import { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'

import { MAX_CRYPTO_AMOUNT_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber, trimEnd } from '../../locales/intl'
import { useSelector } from '../../types/reactRedux'
import { DECIMAL_PRECISION } from '../../util/utils'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { Tile, TileType } from './Tile'

interface Props {
  denomination: EdgeDenomination
  maxCryptoChars?: number
  nativeCryptoAmount: string
  title: string
  walletId: string
  tokenId?: string
  type?: TileType
  onPress?: () => Promise<void> | void
}

export const CryptoFiatAmountTile = (props: Props) => {
  const { denomination, maxCryptoChars, nativeCryptoAmount, title, walletId, tokenId, type = 'static', onPress } = props
  const wallet = useSelector(state => state.core.account.currencyWallets[walletId])

  const { name: cryptoName, multiplier: cryptoDenomMult } = denomination

  // Convert wallet native denomination to exchange denomination
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const cryptoAmountDenom = div(nativeCryptoAmount, cryptoDenomMult, DECIMAL_PRECISION)

  // Default to 10 displayed chars for crypto amount
  const fmtCryptoAmount = trimEnd(formatNumber(cryptoAmountDenom, { toFixed: maxCryptoChars === undefined ? MAX_CRYPTO_AMOUNT_CHARACTERS : maxCryptoChars }))
  const cryptoAmountText = `${fmtCryptoAmount} ${cryptoName} `

  // Fiat amount is always positive for this specific tile
  const absCryptoAmount = abs(nativeCryptoAmount)

  return (
    <Tile type={type} title={title} contentPadding={false} onPress={onPress}>
      <EdgeText>
        {cryptoAmountText}
        (<FiatText wallet={wallet} tokenId={tokenId} nativeCryptoAmount={absCryptoAmount} />)
      </EdgeText>
    </Tile>
  )
}
