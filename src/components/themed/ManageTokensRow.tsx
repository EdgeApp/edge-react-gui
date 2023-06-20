import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Pressable, Switch, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { approveTokenTerms } from '../../actions/TokenTermsActions'
import { useHandler } from '../../hooks/useHandler'
import { usePendingPressAnimation } from '../../hooks/usePendingPress'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logActivity } from '../../util/logger'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

export interface Props {
  // Scene properties:
  navigation: NavigationProp<'manageTokens'>
  wallet: EdgeCurrencyWallet

  // Token information:
  isCustom: boolean
  isEnabled: boolean
  token: EdgeToken
  tokenId: string
}

const AnimatedSpinner = Animated.createAnimatedComponent(ActivityIndicator)
const AnimatedSwitch = Animated.createAnimatedComponent(Switch)

export const ManageTokensRowComponent = (props: Props) => {
  const { navigation, wallet, isCustom, isEnabled, token, tokenId } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const disklet = useSelector(state => state.core.disklet)

  // Handle editing custom tokens:
  const handleEdit = useHandler(() => {
    const { currencyCode, displayName, denominations, networkLocation } = token
    navigation.navigate('editToken', {
      currencyCode,
      displayName,
      multiplier: denominations[0]?.multiplier,
      networkLocation,
      tokenId,
      walletId: wallet.id
    })
  })

  // Handle toggling the token on or off:
  const [pending, handleToggle] = usePendingPressAnimation(async () => {
    if (!isEnabled) await approveTokenTerms(disklet, wallet.currencyInfo.currencyCode)

    const newIds = isEnabled ? wallet.enabledTokenIds.filter(id => id !== tokenId) : [...wallet.enabledTokenIds, tokenId]
    await wallet.changeEnabledTokenIds(newIds)
    if (isEnabled) {
      logActivity(`Disable Token: ${getWalletName(wallet)} ${wallet.type} ${wallet.id} ${tokenId}`)
    } else {
      logActivity(`Enable Token: ${getWalletName(wallet)} ${wallet.type} ${wallet.id} ${tokenId}`)
    }
  })

  // Animate the spinner in while the toggle is pending:
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: pending.value
  }))
  const switchStyle = useAnimatedStyle(() => ({
    opacity: 1 - pending.value
  }))

  return (
    <Pressable style={styles.row} onPress={handleToggle}>
      <CryptoIcon
        marginRem={0.5}
        sizeRem={2}
        // Use the pluginId to avoid showing the wallet loading spinner:
        pluginId={wallet.currencyInfo.pluginId}
        tokenId={tokenId}
      />
      <View style={styles.nameColumn}>
        <EdgeText style={styles.currencyCode}>{token.currencyCode}</EdgeText>
        <EdgeText style={styles.displayName}>{token.displayName}</EdgeText>
      </View>
      {!isCustom ? null : (
        <TouchableOpacity style={styles.editIcon} onPress={handleEdit}>
          <FontAwesomeIcon color={theme.iconTappable} name="edit" size={theme.rem(1)} accessibilityHint={lstrings.edit_icon_hint} accessibilityRole="button" />
        </TouchableOpacity>
      )}
      <View pointerEvents="none" style={styles.switchBox}>
        <AnimatedSpinner color={theme.iconTappable} style={[styles.spinner, spinnerStyle]} accessibilityHint={lstrings.spinner_hint} />
        <AnimatedSwitch
          ios_backgroundColor={theme.toggleButtonOff}
          accessibilityHint={lstrings.toggle_button_hint}
          accessibilityActions={[{ name: 'activate', label: lstrings.toggle_button_hint }]}
          accessibilityValue={{ text: isEnabled ? lstrings.on_hint : lstrings.off_hint }}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
          style={switchStyle}
          value={isEnabled}
        />
      </View>
    </Pressable>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: theme.rem(4),
    marginHorizontal: theme.rem(0.5)
  },

  // Token name:
  nameColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    marginHorizontal: theme.rem(0.5)
  },
  currencyCode: {
    fontFamily: theme.fontFaceMedium
  },
  displayName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },

  // Edit icon for custom tokens:
  editIcon: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(0.5)
  },

  // Toggle and spinner:
  spinner: {
    position: 'absolute',
    height: theme.rem(1.5)
  },
  switchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.rem(0.5)
  }
}))

export const ManageTokensRow = React.memo(ManageTokensRowComponent)
