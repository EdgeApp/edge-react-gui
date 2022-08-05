// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Fontello } from '../../assets/vector/index.js'
import s from '../../locales/strings'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

export type Props = {
  copyToClipboard: () => void,
  fioAddressModal: () => void,
  shareViaShare: () => void
}

export function ShareButtons(props: Props) {
  const { copyToClipboard, shareViaShare, fioAddressModal } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <ShareButton icon="FIO-geometric" text={s.strings.fio_reject_request_title} onPress={fioAddressModal} />
      <ShareButton icon="Copy-icon" text={s.strings.fragment_request_copy_title} onPress={copyToClipboard} />
      <ShareButton icon="FIO-share" text={s.strings.string_share} onPress={shareViaShare} />
    </View>
  )
}

function ShareButton(props: { text: string, onPress: () => void, icon: string }) {
  const { icon, text, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
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
