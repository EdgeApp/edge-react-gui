// @flow

import React, { PureComponent } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import s from '../../../../locales/strings'
import { THEME } from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'
import FormattedText from '../FormattedText'

export type Props = {
  copyToClipboard(): mixed,
  fioAddressModal(): mixed,
  shareViaShare(): mixed
}
export class ShareButtons extends PureComponent<Props> {
  render() {
    const { copyToClipboard, shareViaShare, fioAddressModal } = this.props

    return (
      <View style={styles.row}>
        <ShareButton text={s.strings.fio_reject_request_title} onPress={fioAddressModal} border />
        <ShareButton text={s.strings.fragment_request_copy_title} onPress={copyToClipboard} border />
        <ShareButton text={s.strings.string_share} onPress={shareViaShare} />
      </View>
    )
  }
}

function ShareButton(props: { text: string, onPress(): mixed, border?: boolean }) {
  const { text, onPress, border = false } = props

  return (
    <TouchableOpacity style={styles.shareButton} onPress={onPress}>
      <View style={border ? [styles.borderBox, styles.borderRight] : styles.borderBox}>
        <FormattedText style={styles.text}>{text}</FormattedText>
      </View>
    </TouchableOpacity>
  )
}

const rawStyles = {
  row: {
    justifyContent: 'center',
    flexDirection: 'row'
  },
  shareButton: {
    // Layout:
    flexGrow: 1,
    flexBasis: 1,
    paddingVertical: scale(14),

    // Appearance:
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderColor: THEME.COLORS.GRAY_4,

    // Children:
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'row'
  },

  borderBox: {
    width: '100%',
    paddingVertical: scale(2),

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  borderRight: {
    borderColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.MID}`,
    borderRightWidth: 1
  },

  text: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.WHITE
  }
}

const styles: typeof rawStyles = StyleSheet.create(rawStyles)
