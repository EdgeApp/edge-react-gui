import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Text } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { lstrings } from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { useTheme } from '../../services/ThemeContext'
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

/**
 * A view representing the data from a wallet, used for rows, cards, etc.
 */
const CurrencyRowComponent = (props: Props) => {
  const { marginRem, showRate = false, token, tokenId, wallet } = props
  const { pluginId } = wallet.currencyInfo
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  const theme = useTheme()

  // Currency code for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const { currencyCode } = tokenFromId == null ? wallet.currencyInfo : tokenFromId

  // Wallet name for display:
  let name: React.ReactNode = useWalletName(wallet)
  const compromised = useSelector(state => {
    const { modalShown = 0 } = state.ui.settings.securityCheckedWallets[wallet.id] ?? {}
    return modalShown > 0
  })
  if (compromised) {
    name = (
      <>
        <Text style={{ color: theme.warningText }}>{lstrings.compromised_key_label}</Text> {name}
      </>
    )
  }

  // Balance stuff:
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)
  const icon = <CryptoIcon sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
  const tickerText = showRate && wallet != null ? <TickerText wallet={wallet} tokenId={tokenId} /> : null
  const cryptoText = showBalance ? <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={balance} withSymbol /> : null
  const fiatText = showBalance ? <FiatText nativeCryptoAmount={balance} tokenId={tokenId} wallet={wallet} /> : null

  let displayCurrencyCode = currencyCode
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = `${tokenFromId.displayName}`
  }

  return (
    <IconDataRow
      icon={icon}
      leftText={displayCurrencyCode}
      leftTextExtended={tickerText}
      leftSubtext={name}
      rightText={cryptoText}
      rightSubText={fiatText}
      marginRem={marginRem}
    />
  )
}

export const CurrencyRow = React.memo(CurrencyRowComponent)
