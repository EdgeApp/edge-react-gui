import type { EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { WalletIcon } from '../icons/WalletIcon'
import { useTheme } from '../services/ThemeContext'
import { CryptoText } from '../text/CryptoText'
import { UnscaledText } from '../text/UnscaledText'
import { IconDataRow } from './IconDataRow'

interface Props {
  marginRem?: number[] | number
  nativeAmount?: string
  /** Override user show/hide balance settings. If unset, defaults to user show/hide balance settings. */
  hideBalance?: boolean
  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

/**
 * A view representing the data from a wallet, used for rows, cards, etc.
 */
const CurrencyRowComponent: React.FC<Props> = props => {
  const { marginRem, nativeAmount, hideBalance, token, tokenId, wallet } = props
  const { pluginId } = wallet.currencyInfo
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  const theme = useTheme()

  // Currency code for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = token ?? (tokenId == null ? null : allTokens[tokenId])
  const { currencyCode } = tokenFromId ?? wallet.currencyInfo

  // Wallet name for display:
  let name: React.ReactNode = useWalletName(wallet)
  const compromised = useSelector(state => {
    const { modalShown = 0 } =
      state.ui?.settings?.securityCheckedWallets?.[wallet.id] ?? {}
    return modalShown > 0
  })
  if (compromised) {
    name = (
      <>
        <UnscaledText style={{ color: theme.warningText }}>
          {lstrings.compromised_key_label + ' '}
        </UnscaledText>
        {name}
      </>
    )
  }

  // Balance stuff:
  const hideBalanceSetting = useSelector(
    state => hideBalance ?? !state.ui.settings.isAccountBalanceVisible
  )
  const balance = useWalletBalance(wallet, tokenId)
  const icon = <WalletIcon sizeRem={2} tokenId={tokenId} wallet={wallet} />
  const cryptoText = (
    <CryptoText
      wallet={wallet}
      tokenId={tokenId}
      nativeAmount={nativeAmount ?? balance}
      withSymbol
      hideBalance={hideBalanceSetting}
    />
  )
  const { denomination, isoFiatCurrencyCode } = useTokenDisplayData({
    tokenId,
    currencyConfig: wallet.currencyConfig
  })
  const fiatText = useFiatText({
    nativeCryptoAmount: nativeAmount ?? balance,
    tokenId,
    pluginId,
    cryptoExchangeMultiplier: denomination.multiplier,
    isoFiatCurrencyCode,
    hideBalance: hideBalanceSetting
  })

  let displayCurrencyCode = currencyCode
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = tokenFromId.displayName
  }

  return (
    <IconDataRow
      icon={icon}
      leftText={displayCurrencyCode}
      leftSubtext={name}
      rightText={cryptoText}
      rightSubText={fiatText}
      marginRem={marginRem}
    />
  )
}

export const CurrencyRow = React.memo(CurrencyRowComponent)
