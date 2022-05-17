// @flow

import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Pressable, Switch, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { useHandler } from '../../hooks/useHandler.js'
import { usePendingPressAnimation } from '../../hooks/usePendingPress.js'
import { memo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'

export type Props = {
  // Scene properties:
  navigation: NavigationProp<'manageTokens'>,
  wallet: EdgeCurrencyWallet,

  // Token information:
  isCustom: boolean,
  isEnabled: boolean,
  token: EdgeToken,
  tokenId: string
}

const AnimatedSpinner = Animated.createAnimatedComponent(ActivityIndicator)
const AnimatedSwitch = Animated.createAnimatedComponent(Switch)

export const ManageTokensRow = memo((props: Props) => {
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
      <CurrencyIcon
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
          <FontAwesomeIcon color={theme.iconTappable} name="edit" size={theme.rem(1)} />
        </TouchableOpacity>
      )}
      <View pointerEvents="none" style={styles.switchBox}>
        <AnimatedSpinner color={theme.iconTappable} style={[styles.spinner, spinnerStyle]} />
        <AnimatedSwitch
          ios_backgroundColor={theme.toggleButtonOff}
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
})

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
