// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui'
import styles, { styles as styleRaw } from '../../modules/UI/components/Modal/style'

type Props = {
  cancelText: string,
  doneText: string,
  onDone(): void,
  onCancel(): void
}
export default class TwoButtonsComponent extends Component<Props> {
  render () {
    const { onDone, onCancel } = this.props

    return (
      <View style={[styles.buttonsWrap]}>
        <TouchableHighlight style={[styles.cancelButtonWrap, styles.stylizedButton]} underlayColor={styleRaw.cancelUnderlay.color} onPress={onCancel}>
          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.stylizedButtonText]}>{this.props.cancelText}</FormattedText>
          </View>
        </TouchableHighlight>

        <TouchableHighlight style={[styles.doneButtonWrap, styles.stylizedButton]} underlayColor={styleRaw.doneUnderlay.color} onPress={onDone}>
          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.stylizedButtonText]}>{this.props.doneText}</FormattedText>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
