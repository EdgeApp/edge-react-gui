// @flow

import React, { Component } from 'react'
import { View } from 'react-native'
import { PrimaryButton, SecondaryButton } from '../Buttons'
import s from '../../../../locales/strings.js'
import styles from './style'

type Props = {
  positiveText: string,
  onPositive: (...args: any) => void,
  onNegative: (...args: any) => void
}

export default class OptionButtons extends Component<Props> {
  render () {
    return (
      <View style={[styles.buttonsWrap]}>
        <SecondaryButton style={[styles.cancelButtonWrap, styles.stylizedButton]} onPress={this.props.onNegative}>
          <SecondaryButton.Text style={[styles.cancelButton, styles.stylizedButtonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
        </SecondaryButton>

        <PrimaryButton style={[styles.doneButtonWrap, styles.stylizedButton]} onPress={this.props.onPositive}>
          <PrimaryButton.Text style={[styles.doneButton, styles.stylizedButtonText]}>{this.props.positiveText}</PrimaryButton.Text>
        </PrimaryButton>
      </View>
    )
  }
}
