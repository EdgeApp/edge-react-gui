// @flow

import React from 'react'
import { Image, Linking, Text } from 'react-native'

import { swapPluginIcons, swapPluginLogos } from '../../assets/images/exchange'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, ModalCloseArrow, THEME, textStyles } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<boolean>
}

const goToUrl = () => {
  Linking.openURL('https://ShapeShift.io')
}

export function SwapVerifyShapeshiftModal (props: Props) {
  const { bridge } = props
  const iconSize = THEME.rem(1.75)

  return (
    <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <IconCircle>
        <Image source={swapPluginIcons.shapeshift} resizeMode={'contain'} style={{ height: iconSize, width: iconSize }} />
      </IconCircle>

      <ContentArea padding="wide">
        <Image source={swapPluginLogos.shapeshift} style={{ alignSelf: 'center' }} />
        <Text style={textStyles.bodyParagraph}>{s.strings.ss_need_more_kyc}</Text>
        <PrimaryButton onPress={goToUrl}>
          <PrimaryButton.Text>{s.strings.ss_visit_website}</PrimaryButton.Text>
        </PrimaryButton>
      </ContentArea>

      <ModalCloseArrow onPress={() => bridge.resolve(false)} />
    </AirshipModal>
  )
}
