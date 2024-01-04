import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { useCryptoText } from '../../hooks/useCryptoText'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  nativeAmount: string
  tokenId?: EdgeTokenId
  wallet: EdgeCurrencyWallet
  withSymbol?: boolean
  hideBalance?: boolean
}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 **/
export const CryptoText = React.memo((props: Props) => {
  const { wallet, tokenId, nativeAmount, withSymbol, hideBalance = false } = props
  const cryptoText = useCryptoText({ wallet, tokenId, nativeAmount, withSymbol, hideBalance })

  return <EdgeText>{cryptoText}</EdgeText>
})
