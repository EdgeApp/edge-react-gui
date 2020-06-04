// @flow

import { PrimaryButton } from 'edge-components'
import React, { Component } from 'react'
import { ScrollView } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<void>,
  body: string
}

export class RawTextModal extends Component<Props> {
  render() {
    const { body, bridge } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>
          <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
        </IconCircle>
        <ContentArea padding="wide">
          <ScrollView>
            <Text>{body}</Text>
          </ScrollView>
          <PrimaryButton onPress={() => bridge.resolve()}>
            <PrimaryButton.Text>{s.strings.string_ok_cap}</PrimaryButton.Text>
          </PrimaryButton>
        </ContentArea>
      </AirshipModal>
    )
  }
}
