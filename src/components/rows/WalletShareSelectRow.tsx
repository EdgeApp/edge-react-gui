import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { useWalletName } from '../../hooks/useWalletName'
import { useSelector } from '../../types/reactRedux'
import { triggerHaptic } from '../../util/haptic'
import { EdgeCard } from '../cards/EdgeCard'
import { CryptoIcon } from '../icons/CryptoIcon'
import { CheckmarkCircleIcon } from '../icons/ThemedIcons'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText'
import { IconDataRow } from './IconDataRow'

const ICON_SIZE_REM = 2

interface Props {
  wallet: EdgeCurrencyWallet
  selected: boolean
  onPress: (walletId: string) => void
}

/**
 * A wallet row for multi-select lists. The asset icon gives way to a green
 * checkmark while the row is selected. Shows balances but no exchange rate,
 * since the rate is noise when the question is "which wallets?".
 */
const WalletShareSelectRowComponent: React.FC<Props> = props => {
  const { wallet, selected, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const walletName = useWalletName(wallet)
  const hideBalance = useSelector(
    state => !state.ui.settings.isAccountBalanceVisible
  )
  const balance = useWalletBalance(wallet, null)
  const { currencyCode, pluginId } = wallet.currencyInfo

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    onPress(wallet.id)
  })

  const icon = selected ? (
    <View style={styles.checkContainer}>
      <CheckmarkCircleIcon
        size={theme.rem(ICON_SIZE_REM)}
        color={theme.positiveText}
      />
    </View>
  ) : (
    <CryptoIcon pluginId={pluginId} tokenId={null} sizeRem={ICON_SIZE_REM} />
  )

  return (
    <EdgeCard
      onPress={handlePress}
      testID={`walletShareSelectRow_${walletName}_${currencyCode}`}
    >
      <IconDataRow
        icon={icon}
        leftText={currencyCode}
        leftSubtext={walletName}
        rightText={
          <CryptoText
            wallet={wallet}
            tokenId={null}
            nativeAmount={balance}
            withSymbol
            hideBalance={hideBalance}
          />
        }
        rightSubText={
          <FiatText
            nativeCryptoAmount={balance}
            tokenId={null}
            currencyConfig={wallet.currencyConfig}
            hideBalance={hideBalance}
            autoPrecision={false}
            style={styles.fiatText}
          />
        }
        marginRem={0.25}
      />
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  checkContainer: {
    // Match CryptoIcon's footprint so the row does not shift on toggle:
    width: theme.rem(ICON_SIZE_REM),
    height: theme.rem(ICON_SIZE_REM),
    alignItems: 'center',
    justifyContent: 'center'
  },
  fiatText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletShareSelectRow = React.memo(WalletShareSelectRowComponent)
