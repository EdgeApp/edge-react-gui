// @flow

import * as React from 'react'
import { Image, Text, TouchableHighlight, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { dayText, textSize } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { IconCircle } from '../common/IconCircle.js'
import { LadderLayout } from '../common/LadderLayout'

type Props = {
  bridge: AirshipBridge<void>,
  onUpdate(): void,
  onSkip(): void
}

export class UpdateModal extends React.Component<Props> {
  render() {
    const { bridge } = this.props

    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>
          <View
            style={{
              width: THEME.rem(3.5),
              height: THEME.rem(3.5),
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
