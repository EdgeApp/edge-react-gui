// @flow

import { PrimaryButton } from 'edge-components'
import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { type AirshipBridge, AirshipModal, ContentArea, dayText, IconCircle, ModalIcon } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<boolean>,
  icon?: string,
  iconType?: string,
  iconImage?: string,
  title: string,
  subTitle: string,
  cancelText: string,
  doneText: string
}

export class TwoButtonSimpleConfirmationModal extends Component<Props> {
  render () {
    const { bridge, cancelText, doneText, subTitle, title, icon, iconType, iconImage } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
        <IconCircle>
          <ModalIcon icon={icon} iconType={iconType} iconImage={iconImage} />
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
