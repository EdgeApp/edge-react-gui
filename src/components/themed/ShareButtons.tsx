import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Fontello } from '../../assets/vector/index'
import { usePendingPress } from '../../hooks/usePendingPress'
import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface Props {
  copyToClipboard: () => Promise<void>
  openFioAddressModal: () => Promise<void>
  openShareModal: () => Promise<void>
}

export function ShareButtons(props: Props) {
  const { copyToClipboard, openShareModal, openFioAddressModal } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <ShareButton icon="FIO-geometric" text={lstrings.fio_reject_request_title} onPress={openFioAddressModal} />
      <ShareButton icon="Copy-icon" text={lstrings.fragment_request_copy_title} onPress={copyToClipboard} />
      <ShareButton icon="FIO-share" text={lstrings.string_share} onPress={openShareModal} />
    </View>
  )
}

function ShareButton(props: { text: string; onPress: () => Promise<void>; icon: string }) {
  const { icon, text, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [pending, handlePress] = usePendingPress(onPress)

  return (
    <TouchableOpacity accessible={false} style={styles.button} onPress={handlePress} disabled={pending}>
      <Fontello name={icon} size={theme.rem(1.5)} style={styles.image} color={theme.iconTappable} />
      <EdgeText style={styles.text}>{text}</EdgeText>
    </TouchableOpacity>
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
