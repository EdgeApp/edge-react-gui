// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'

import s from '../../../../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../../components/Buttons'
import styles from '../style.js'

export type DeleteTokenButtonsProps = {
  onPressCancel: () => void,
  onPressDelete: () => void,
  processingFlag: boolean
}

export default class DeleteTokenButtons extends Component<DeleteTokenButtonsProps> {
  render () {
    const { processingFlag } = this.props
    return (
      <View style={[styles.deleteModalButtonsArea]}>
        <SecondaryButton onPress={this.props.onPressCancel} style={[styles.modalCancelButton, styles.button]}>
          <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
        </SecondaryButton>
        <PrimaryButton style={[styles.modalDeleteButton, styles.button]} onPress={this.props.onPressDelete}>
          {processingFlag ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_delete}</PrimaryButton.Text>}
        </PrimaryButton>
      </View>
    )
  }
}
