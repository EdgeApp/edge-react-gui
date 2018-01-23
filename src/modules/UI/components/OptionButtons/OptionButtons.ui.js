// @flow

import React, {Component} from 'react'
import {View, TouchableHighlight} from 'react-native'

import T from '../FormattedText/FormattedText.ui'
import styles from './style'
import s from '../../../../locales/strings.js'

type Props = {
  positiveText: string,
  onPositive: (...args: any) => void,
  onNegative: (...args: any) => void
}
type State = {}

export default class OptionButtons extends Component<Props, State> {
  render () {
    return (
      <View style={[styles.buttonsWrap]}>

        <TouchableHighlight style={[styles.cancelButtonWrap, styles.stylizedButton]}
          onPress={this.props.onNegative}>
          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.cancelButton, styles.stylizedButtonText]}>
              {s.strings.string_cancel_cap}
            </T>
          </View>
        </TouchableHighlight>

        <TouchableHighlight style={[styles.doneButtonWrap, styles.stylizedButton]}
          onPress={this.props.onPositive}>
          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.doneButton, styles.stylizedButtonText]}>
              {this.props.positiveText}
            </T>
          </View>
        </TouchableHighlight>

      </View>
    )
  }
}
