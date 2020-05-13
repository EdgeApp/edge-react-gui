// @flow

import React, { Component } from 'react'
import { Text, TouchableHighlight, View } from 'react-native'
import { Image } from 'react-native-animatable'

import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons'
import { LadderLayout } from '../common/LadderLayout'
import { type AirshipBridge, AirshipModal, dayText, IconCircle, textSize, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<mixed>,
  newVersion: string,
  released: string,
  onUpdate(): void,
  onSkip(): void
}

export class UpdateModal extends Component<Props> {
  render () {
    const { bridge } = this.props

    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>
          <View
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: THEME.COLORS.PRIMARY
            }}
          >
            <Image source={edgeLogo} />
          </View>
        </IconCircle>

        <View
          style={{
            padding: THEME.rem(1),
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <LadderLayout padding={THEME.rem(1)}>
            <Text style={dayText('title')}>{s.strings.update_header}</Text>

            <Text style={[dayText('center'), { lineHeight: textSize.large }]}>{s.strings.update_fresh}</Text>

            <PrimaryButton style={{ width: '70%' }} onPress={this.props.onUpdate}>
              <Text style={[dayText(), { color: THEME.COLORS.WHITE }]}>{s.strings.update_now}</Text>
            </PrimaryButton>

            <TouchableHighlight onPress={this.props.onSkip}>
              <Text style={[dayText(), { color: THEME.COLORS.PRIMARY }]}>{s.strings.update_later}</Text>
            </TouchableHighlight>
          </LadderLayout>
        </View>
      </AirshipModal>
    )
  }
}
