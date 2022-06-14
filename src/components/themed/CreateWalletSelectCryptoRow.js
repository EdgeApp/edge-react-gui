// @flow
import { wrap } from 'cavy'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { memo } from '../../types/reactHooks.js'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {|
  currencyCode: string,
  walletName: string,

  // Icon currency:
  pluginId?: string,
  tokenId?: string,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: () => void
|}

export const CreateWalletSelectCryptoRowComponent = (props: Props) => {
  const {
    currencyCode,
    walletName,

    // Icon currency:
    pluginId,
    tokenId,

    // Callbacks:
    onLongPress,
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity style={styles.container} onLongPress={onLongPress} onPress={onPress}>
      <CryptoIcon currencyCode={currencyCode} marginRem={1} pluginId={pluginId} sizeRem={2} tokenId={tokenId} />
      <View style={styles.detailsContainer}>
        <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
        <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
      </View>
      <View style={styles.childrenContainer}>
        <IonIcon size={theme.rem(1.5)} color={theme.iconTappable} name="chevron-forward-outline" />
      </View>
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

export const CreateWalletSelectCryptoRow = memo(wrap(CreateWalletSelectCryptoRowComponent))
