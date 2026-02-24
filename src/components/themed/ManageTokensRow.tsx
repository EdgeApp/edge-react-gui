import type { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Pressable, Switch, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { approveTokenTerms } from '../../actions/TokenTermsActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

export interface Props {
  // Scene properties:
  navigation: EdgeAppSceneProps<'manageTokens'>['navigation']
  wallet: EdgeCurrencyWallet

  // Token information:
  isCustom: boolean
  isEnabled: boolean
  token: EdgeToken
  tokenId: string

  // Callbacks:
  onToggle: (tokenId: string) => void
}

export const ManageTokensRowComponent: React.FC<Props> = props => {
  const { navigation, wallet, isCustom, isEnabled, token, tokenId, onToggle } =
    props
  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)

  const theme = useTheme()
  const styles = getStyles(theme)

  // Prevent concurrent toggle operations (e.g., double-tap while modal is open):
  const pendingRef = React.useRef(false)

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
  const handleToggle = useHandler(() => {
    // Prevent concurrent calls:
    if (pendingRef.current) return
    pendingRef.current = true

    // Approve token terms when enabling:
    if (!isEnabled) {
      approveTokenTerms(
        account,
        wallet.currencyInfo.pluginId,
        countryCode
      ).then(
        approved => {
          pendingRef.current = false
          if (approved) onToggle(tokenId)
        },
        (error: unknown) => {
          pendingRef.current = false
          showError(error)
        }
      )
    } else {
      pendingRef.current = false
      onToggle(tokenId)
    }
  })

  return (
    <Pressable style={styles.row} onPress={handleToggle}>
      <CryptoIcon
        marginRem={[0, 0.5, 0, 0]} // We don't need left margins because there's no border. This component effectively is the left "border"
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
        <EdgeTouchableOpacity style={styles.editIcon} onPress={handleEdit}>
          <FontAwesomeIcon
            color={theme.iconTappable}
            name="edit"
            size={theme.rem(1)}
            accessibilityHint={lstrings.edit_icon_hint}
            accessibilityRole="button"
          />
        </EdgeTouchableOpacity>
      )}
      <View pointerEvents="none" style={styles.switchBox}>
        <Switch
          ios_backgroundColor={theme.toggleButtonOff}
          accessibilityHint={lstrings.toggle_button_hint}
          accessibilityActions={[
            { name: 'activate', label: lstrings.toggle_button_hint }
          ]}
          accessibilityValue={{
            text: isEnabled ? lstrings.on_hint : lstrings.off_hint
          }}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
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

  // Toggle:
  switchBox: {
    alignItems: 'center',
    justifyContent: 'center'
  }
}))

export const ManageTokensRow = React.memo(ManageTokensRowComponent)
