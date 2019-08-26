// @flow

import { PrimaryButton } from 'edge-components'
import React, { Component } from 'react'
import { Text } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME, textStyles } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<void>,
  text: string,
  buttonText: string
}

export class SimpleConfirmationModal extends Component<Props> {
  render () {
    const { bridge, buttonText, text } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>
          <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
        </IconCircle>
        <ContentArea padding="wide">
          <Text style={[textStyles.bodyParagraph, { flexGrow: 1 }]}>{text}</Text>
          <PrimaryButton onPress={() => bridge.resolve()}>
            <PrimaryButton.Text>{buttonText}</PrimaryButton.Text>
          </PrimaryButton>
        </ContentArea>
      </AirshipModal>
    )
  }
}
