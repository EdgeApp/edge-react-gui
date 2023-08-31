import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useCryptoText } from '../../hooks/useCryptoText'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  nativeAmount: string
  tokenId?: string
  wallet: EdgeCurrencyWallet
  withSymbol?: boolean
}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 **/
export const CryptoText = React.memo(({ wallet, tokenId, nativeAmount, withSymbol }: Props) => {
  const cryptoText = useCryptoText({ wallet, tokenId, nativeAmount, withSymbol })

  return <EdgeText>{cryptoText}</EdgeText>
})
