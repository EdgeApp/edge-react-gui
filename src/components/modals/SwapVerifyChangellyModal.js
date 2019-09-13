// @flow

import React from 'react'
import { Image, Linking, Text, View } from 'react-native'

import { swapPluginIcons } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME, dayText } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<boolean>
}

function termsClick () {
  Linking.openURL('https://changelly.com/terms-of-use')
}

function privacyClick () {
  Linking.openURL('https://changelly.com/privacy-policy')
}

function amlClick () {
  Linking.openURL('https://changelly.com/aml-kyc')
}

export function SwapVerifyChangellyModal (props: Props) {
  const { bridge } = props
  const iconSize = THEME.rem(1.75)
  const linkStyle = dayText('small', 'link')

  return (
    <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <IconCircle>
        <Image source={swapPluginIcons.changelly} resizeMode={'contain'} style={{ height: iconSize, width: iconSize }} />
      </IconCircle>

      <ContentArea padding="wide">
        <Text style={dayText('bold')}>{s.strings.changelly_about}</Text>
        <Text style={dayText()}>{s.strings.changelly_kyc_statement}</Text>
        <PrimaryButton onPress={() => bridge.resolve(true)}>
          <PrimaryButton.Text>{s.strings.accept_button_text}</PrimaryButton.Text>
        </PrimaryButton>
        <SecondaryButton onPress={() => bridge.resolve(false)}>
          <SecondaryButton.Text>{s.strings.changelly_reject_kyc}</SecondaryButton.Text>
        </SecondaryButton>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={linkStyle} onPress={termsClick}>
            {s.strings.terms_of_use}
          </Text>
          <Text style={linkStyle} onPress={privacyClick}>
            {s.strings.privacy_policy}
          </Text>
          <Text style={linkStyle} onPress={amlClick}>
            {s.strings.changelly_aml_kyc}
          </Text>
        </View>
      </ContentArea>
    </AirshipModal>
  )
}
