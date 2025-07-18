import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { Fontello } from '../../assets/vector/index'
import { validateFioAsset } from '../../constants/FioConstants'
import { lstrings } from '../../locales/strings'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface Props {
  copyToClipboard: () => Promise<void>
  openFioAddressModal: () => Promise<void>
  openShareModal: () => Promise<void>

  // Optional props for FIO validation
  account?: EdgeAccount
  pluginId?: string
  tokenId?: string | null
}

export function ShareButtons(props: Props) {
  const {
    copyToClipboard,
    openShareModal,
    openFioAddressModal,
    account,
    pluginId,
    tokenId
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Determine if FIO should be shown
  const shouldShowFio = React.useMemo(() => {
    // If no account info provided, show FIO by default (backwards compatibility)
    if (account == null || pluginId == null) return true

    // Check if FIO plugin exists
    const fioPlugin = account.currencyConfig.fio
    if (fioPlugin == null) return false

    // If we have wallet/token info, validate the specific asset
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig != null) {
      const validation = validateFioAsset(currencyConfig, tokenId ?? null)
      return validation.isValid
    }

    return true
  }, [account, pluginId, tokenId])

  return (
    <View style={styles.container}>
      {shouldShowFio && (
        <ShareButton
          icon="FIO-geometric"
          text={lstrings.fio_reject_request_title}
          onPress={openFioAddressModal}
        />
      )}
      <ShareButton
        icon="Copy-icon"
        text={lstrings.fragment_request_copy_title}
        onPress={copyToClipboard}
      />
      <ShareButton
        icon="FIO-share"
        text={lstrings.string_share}
        onPress={openShareModal}
      />
    </View>
  )
}

function ShareButton(props: {
  text: string
  onPress: () => Promise<void>
  icon: string
}) {
  const { icon, text, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeTouchableOpacity
      accessible={false}
      style={styles.button}
      onPress={onPress}
    >
      <Fontello
        name={icon}
        size={theme.rem(1.5)}
        style={styles.image}
        color={theme.iconTappable}
      />
      <EdgeText style={styles.text}>{text}</EdgeText>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1),
    marginVertical: theme.rem(1)
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    marginBottom: theme.rem(0.5)
  },
  text: {
    textAlign: 'center',
    fontSize: theme.rem(0.75)
  }
}))
