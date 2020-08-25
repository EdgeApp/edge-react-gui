// @flow

import { PrimaryButton, SecondaryButton } from 'edge-components'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { type AirshipBridge, AirshipModal, ContentArea, dayText, IconCircle, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<'one' | 'two' | 'cancel'>,
  icon?: React.Node,
  title: string,
  subTitle: string,
  oneText: string,
  twoText: string,
  cancelText: string
}

export class ThreeButtonSimpleConfirmationModal extends React.Component<Props> {
  render() {
    const {
      bridge,
      cancelText,
      oneText,
      twoText,
      subTitle,
      title,
      icon = <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
    } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve('cancel')}>
        <IconCircle>{icon}</IconCircle>
        <ContentArea padding="wide">
          <Text style={dayText('title')}>{title}</Text>
          <Text style={dayText('autoCenter')}>{subTitle}</Text>
          <PrimaryButton onPress={() => bridge.resolve('one')}>
            <PrimaryButton.Text>{oneText}</PrimaryButton.Text>
          </PrimaryButton>
          <SecondaryButton onPress={() => bridge.resolve('two')}>
            <PrimaryButton.Text>{twoText}</PrimaryButton.Text>
          </SecondaryButton>
          <TouchableOpacity onPress={() => bridge.resolve('cancel')}>
            <Text style={dayText('autoCenter', 'link')}>{cancelText}</Text>
          </TouchableOpacity>
        </ContentArea>
      </AirshipModal>
    )
  }
}
