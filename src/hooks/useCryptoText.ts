import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { getCryptoText } from '../util/cryptoTextUtils'
import { useDisplayDenom } from './useDisplayDenom'
import { useTokenDisplayData } from './useTokenDisplayData'

interface Props {
  nativeAmount: string
  wallet: EdgeCurrencyWallet
  hideBalance?: boolean
  tokenId: EdgeTokenId
  withSymbol?: boolean
}

export const useCryptoText = ({ wallet, tokenId, nativeAmount, withSymbol, hideBalance }: Props): string => {
  const {
    denomination: exchangeDenomination,
    fiatDenomination,
    assetToFiatRate
  } = useTokenDisplayData({
    tokenId,
    wallet
  })
  const displayDenomination = useDisplayDenom(wallet.currencyConfig, tokenId)

  const cryptoText = getCryptoText({
    displayDenomination,
    exchangeDenomination,
    exchangeRate: assetToFiatRate,
    fiatDenomination,
    nativeAmount,
    currencyCode: withSymbol ? undefined : displayDenomination.name,
    hideBalance
  })

  return cryptoText
}
