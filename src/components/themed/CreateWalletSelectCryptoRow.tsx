import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { CryptoIcon } from '../icons/CryptoIcon'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  rightSide?: React.ReactNode
  walletName: string

  // Icon currency:
  pluginId: string
  tokenId?: string

  // Callbacks:
  onPress?: () => Promise<void> | void
}

export const CreateWalletSelectCryptoRowComponent = (props: Props) => {
  const {
    rightSide,
    walletName,

    // Icon currency:
    pluginId,
    tokenId,

    // Callbacks:
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyConfigs = useWatch(account, 'currencyConfig')
  const isToken = tokenId != null
  const tokenOrCurrencyInfo = isToken ? currencyConfigs[pluginId].allTokens[tokenId] : currencyConfigs[pluginId].currencyInfo
  const networkName = isToken ? ` (${currencyConfigs[pluginId].currencyInfo.displayName})` : ''

  const handlePress = useHandler(() => {
    if (onPress != null) onPress()?.catch(err => showError(err))
  })

  return (
    <TouchableOpacity style={styles.container} disabled={onPress == null} onPress={handlePress}>
      <CryptoIcon marginRem={1} pluginId={pluginId} sizeRem={2} tokenId={tokenId} />
      <View style={styles.detailsContainer}>
        <EdgeText style={styles.detailsCurrency}>{`${tokenOrCurrencyInfo == null ? '' : tokenOrCurrencyInfo.currencyCode}${networkName}`}</EdgeText>
        <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
      </View>
      <View style={styles.childrenContainer}>{rightSide}</View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Background
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  // Data containers //
  // Details Container
  detailsContainer: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  // Children (Right part) Container
  childrenContainer: {
    paddingRight: theme.rem(0.5)
  },
  // Other styles
  detailsCurrency: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  detailsName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const CreateWalletSelectCryptoRow = React.memo(CreateWalletSelectCryptoRowComponent)
