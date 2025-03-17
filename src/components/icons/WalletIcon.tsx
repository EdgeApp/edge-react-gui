import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import compromisedIcon from '../../assets/images/compromisedIcon.png'
import { useSelector } from '../../types/reactRedux'
import { WalletSyncCircle } from '../progress-indicators/WalletSyncCircle'
import { useTheme } from '../services/ThemeContext'
import { CryptoIcon, CryptoIconProps } from './CryptoIcon'

interface WalletIconProps extends Omit<CryptoIconProps, 'pluginId'> {
  wallet: EdgeCurrencyWallet
}

export const WalletIcon = (props: WalletIconProps) => {
  const { sizeRem = 2, tokenId, wallet } = props
  const { pluginId } = wallet.currencyInfo
  const theme = useTheme()
  const size = theme.rem(sizeRem)

  const compromised = useSelector(state => {
    const { modalShown = 0 } = state.ui?.settings?.securityCheckedWallets?.[wallet.id] ?? {}
    return modalShown > 0
  })

  return (
    <View>
      <WalletSyncCircle
        /* key prevents component from being recycled and shared between wallets */
        key={`${wallet.id}${String(tokenId)}`}
        size={size}
        wallet={wallet}
      />
      <CryptoIcon {...props} pluginId={pluginId} secondaryIconOverride={compromised ? compromisedIcon : undefined} />
    </View>
  )
}
