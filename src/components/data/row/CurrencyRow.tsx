import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'

import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useSelector } from '../../../types/reactRedux'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { TickerText } from '../../text/TickerText'
import { IconDataRow } from './IconDataRow'

interface Props {
  marginRem?: number[] | number
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

// -----------------------------------------------------------------------------
// A view representing the data from a wallet, used for rows, cards, etc.
// -----------------------------------------------------------------------------
const CurrencyRowComponent = (props: Props) => {
  const { marginRem, showRate = false, token, tokenId, wallet } = props

  // Currency code and wallet name for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const { currencyCode } = tokenFromId == null ? wallet.currencyInfo : tokenFromId
  const name = useWalletName(wallet)

  // Balance stuff:
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)
  const icon = <CryptoIcon sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
  const tickerText = showRate && wallet != null ? <TickerText wallet={wallet} tokenId={tokenId} /> : null
  const cryptoText = showBalance ? <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={balance} withSymbol /> : null
  const fiatText = showBalance ? <FiatText nativeCryptoAmount={balance} tokenId={tokenId} wallet={wallet} /> : null

  return (
    <IconDataRow
      icon={icon}
      leftText={currencyCode}
      leftTextExtended={tickerText}
      leftSubtext={name}
      rightText={cryptoText}
      rightSubText={fiatText}
      marginRem={marginRem}
    />
  )
}

export const CurrencyRow = React.memo(CurrencyRowComponent)
