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
    return (
      <View style={[styles.deleteModalButtonsArea]}>
        <SecondaryButton
          text={s.strings.string_cancel_cap}
          onPressFunction={this.props.onPressCancel}
          buttonStyle={[styles.modalCancelButton, styles.button]}
        />
        <PrimaryButton
          text={s.strings.string_delete}
          style={[styles.modalDeleteButton, styles.button]}
          onPressFunction={this.props.onPressDelete}
          processingElement={<ActivityIndicator />}
          processingFlag={this.props.processingFlag}
        />
      </View>
    )
  }
}
