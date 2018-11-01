// @flow

import React, { Component } from 'react'
import { ActivityIndicator, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui'
import styles, { styles as styleRaw } from '../../modules/UI/components/Modal/style'

const CANCEL_TEXT = s.strings.string_cancel_cap
const DONE_TEXT = s.strings.calculator_done

type ModalButtonsOwnProps = {
  onDone: Function,
  onCancel: Function,
  doneButtonActivityFlag: boolean
}

export default class ModalButtons extends Component<ModalButtonsOwnProps> {
  render () {
    const { onDone, onCancel, doneButtonActivityFlag } = this.props
    let doneButtonContent
    if (!doneButtonActivityFlag) {
      doneButtonContent = <FormattedText style={[styles.stylizedButtonText]}>{DONE_TEXT}</FormattedText>
    } else {
      doneButtonContent = <ActivityIndicator />
    }
    return (
      <View style={[styles.buttonsWrap]}>
        <TouchableHighlight style={[styles.cancelButtonWrap, styles.stylizedButton]} underlayColor={styleRaw.cancelUnderlay.color} onPress={onCancel}>
          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.stylizedButtonText]}>{CANCEL_TEXT}</FormattedText>
          </View>
        </TouchableHighlight>

        <TouchableHighlight style={[styles.doneButtonWrap, styles.stylizedButton]} underlayColor={styleRaw.doneUnderlay.color} onPress={onDone}>
          <View style={styles.stylizedButtonTextWrap}>{doneButtonContent}</View>
        </TouchableHighlight>
      </View>
    )
  }
}
