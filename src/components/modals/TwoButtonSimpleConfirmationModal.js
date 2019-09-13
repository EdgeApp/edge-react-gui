// @flow

import { PrimaryButton } from 'edge-components'
import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME, dayText } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<boolean>,
  title: string,
  subTitle: string,
  cancelText: string,
  doneText: string
}

export class TwoButtonSimpleConfirmationModal extends Component<Props> {
  render () {
    const { bridge, cancelText, doneText, subTitle, title } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
        <IconCircle>
          <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
        </IconCircle>
        <ContentArea padding="wide">
          <Text style={dayText('title')}>{title}</Text>
          <Text style={dayText('autoCenter')}>{subTitle}</Text>
          <PrimaryButton onPress={() => bridge.resolve(true)}>
            <PrimaryButton.Text>{doneText}</PrimaryButton.Text>
          </PrimaryButton>
          <TouchableOpacity onPress={() => bridge.resolve(false)}>
            <Text style={dayText('autoCenter', 'link')}>{cancelText}</Text>
          </TouchableOpacity>
        </ContentArea>
      </AirshipModal>
    )
  }
}
