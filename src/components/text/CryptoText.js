// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useCryptoText } from '../../hooks/useCryptoText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { useWatchAccount } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'

type Props = {
  wallet: EdgeCurrencyWallet,
  tokenId?: string,
  nativeAmount: string
}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 **/
export const CryptoText = ({ wallet, tokenId, nativeAmount }: Props) => {
  const account = useSelector(state => state.core.account)
  const currencyConfigMap = useWatchAccount(account, 'currencyConfig')
  const { denomination, fiatDenomination, assetToFiatRate } = useTokenDisplayData({
    currencyConfigMap,
    tokenId,
    wallet
  })

  return useCryptoText({
    nativeAmount,
    exchangeRate: assetToFiatRate,
    fiatDenomination,
    denomination,
    tokenId
  })
}
