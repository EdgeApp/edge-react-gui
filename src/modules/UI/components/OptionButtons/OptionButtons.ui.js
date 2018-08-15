// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import s from '../../../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../Buttons'
import styles from './style.js'

type Props = {
  positiveText: string,
  onPositive: (...args: any) => void,
  onNegative: (...args: any) => void
}

export default class OptionButtons extends Component<Props> {
  render () {
    return (
      <View style={[styles.buttonsWrap]}>
        <SecondaryButton style={styles.cancelButtonWrap} onPress={this.props.onNegative}>
          <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
        </SecondaryButton>

        <PrimaryButton style={styles.doneButtonWrap} onPress={this.props.onPositive}>
          <PrimaryButton.Text>{this.props.positiveText}</PrimaryButton.Text>
        </PrimaryButton>
      </View>
    )
  }
}
