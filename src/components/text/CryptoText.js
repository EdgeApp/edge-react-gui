// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useCryptoText } from '../../hooks/useCryptoText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'

type Props = {|
  nativeAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet
|}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 **/
export const CryptoText = ({ wallet, tokenId, nativeAmount }: Props) => {
  const { denomination, fiatDenomination, assetToFiatRate } = useTokenDisplayData({
    tokenId,
    wallet
  })

  return useCryptoText({
    denomination,
    exchangeRate: assetToFiatRate,
    fiatDenomination,
    nativeAmount,
    tokenId
  })
}
