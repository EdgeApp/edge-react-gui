// @flow

import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

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
      <ShareButton icon={theme.requestFioRequest} text={s.strings.fio_reject_request_title} onPress={fioAddressModal} />
      <ShareButton icon={theme.requestCopy} text={s.strings.fragment_request_copy_title} onPress={copyToClipboard} />
      <ShareButton icon={theme.requestShare} text={s.strings.string_share} onPress={shareViaShare} />
    </View>
  )
}

function ShareButton(props: { text: string, onPress: () => void, icon: string }) {
  const { icon, text, onPress } = props
  const styles = getStyles(useTheme())

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Image style={styles.image} source={icon} resizeMode="contain" />
      <EdgeText style={styles.text}>{text}</EdgeText>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: theme.rem(1),
    marginVertical: theme.rem(1)
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: theme.rem(2),
    height: theme.rem(2),
    marginBottom: theme.rem(0.5)
  },
  text: {
    fontFamily: theme.fontFaceBold,
    textAlign: 'center',
    color: theme.textLink
  }
}))
