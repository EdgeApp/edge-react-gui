import type { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { AsyncSwitch } from '../common/AsyncSwitch'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

export interface Props {
  // Scene properties:
  navigation: EdgeAppSceneProps<'manageTokens'>['navigation']
  wallet: EdgeCurrencyWallet

  // Token information:
  isCustom: boolean
  isEnabled: boolean
  onToggle: (tokenId: string, isEnabled: boolean) => Promise<void>
  token: EdgeToken
  tokenId: string
}

export const ManageTokensRowComponent = (props: Props) => {
  const { navigation, wallet, isCustom, isEnabled, onToggle, token, tokenId } =
    props

  const theme = useTheme()
  const styles = getStyles(theme)

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
  const handleToggle = useHandler(async () => {
    await onToggle(tokenId, isEnabled)
  })

  return (
    <View style={styles.row}>
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
      <AsyncSwitch value={isEnabled} onValueChange={handleToggle} />
    </View>
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
  }
}))

export const ManageTokensRow = React.memo(ManageTokensRowComponent)
