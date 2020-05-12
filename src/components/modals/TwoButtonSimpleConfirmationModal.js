// @flow

import { PrimaryButton } from 'edge-components'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { type AirshipBridge, AirshipModal, ContentArea, dayText, IconCircle, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<boolean>,
  icon?: React.Node,
  title: string,
  subTitle: string,
  cancelText: string,
  doneText: string
}

export class TwoButtonSimpleConfirmationModal extends React.Component<Props> {
  render () {
    const { bridge, cancelText, doneText, subTitle, title, icon = <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} /> } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
        <IconCircle>{icon}</IconCircle>
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
