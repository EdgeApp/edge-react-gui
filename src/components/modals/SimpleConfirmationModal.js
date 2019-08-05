// @flow
import { PrimaryButton } from 'edge-components'
import React, { Component } from 'react'
import { View } from 'react-native'

import { EXCLAMATION, FONT_AWESOME } from '../../constants/indexConstants'
import { scale } from '../../lib/scaling.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { colors } from '../../theme/variables/airbitz.js'
import { type AirshipBridge } from '../common/Airship.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { IconCircle } from '../common/IconCircle.js'

// import DeviceInfo from 'react-native-device-info'

type SimpleConfirmationModalProps = {
  text: string,
  buttonText: string,
  bridge: AirshipBridge<string>
}

type SimpleConfirmationModalState = {}

export class SimpleConfirmationModal extends Component<SimpleConfirmationModalProps, SimpleConfirmationModalState> {
  render () {
    const { bridge, buttonText } = this.props
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve('complete')} center>
        <View style={{ minHeight: 200, paddingLeft: scale(12), paddingRight: scale(12), paddingBottom: scale(12) }}>
          <IconCircle>
            <Icon type={FONT_AWESOME} name={EXCLAMATION} size={36} color={colors.primary} />
          </IconCircle>
          <View style={{ flex: 1, paddingLeft: scale(12), paddingRight: scale(12), paddingTop: scale(12) }}>
            <FormattedText>{this.props.text}</FormattedText>
          </View>
          <PrimaryButton onPress={() => bridge.resolve('complete')}>
            <PrimaryButton.Text>{buttonText}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </AirshipModal>
    )
  }
}
