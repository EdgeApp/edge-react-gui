// @flow

import { type EdgeSwapConfig, type EdgeSwapInfo } from 'edge-core-js/types'
import React from 'react'
import { Image, Linking, Text, View } from 'react-native'

import { swapPluginIcons } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { Airship } from '../services/AirshipInstance.js'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME, dayText } from './modalParts.js'

export async function swapVerifyTerms (swapConfig: EdgeSwapConfig, links: Array<{ text: string, uri: string }>): Promise<boolean> {
  if (swapConfig.userSettings && swapConfig.userSettings.agreedToTerms) {
    return true
  }

  const result = await Airship.show(bridge => <SwapVerifyTermsModal bridge={bridge} swapInfo={swapConfig.swapInfo} links={links} />)

  if (result) {
    await swapConfig.changeUserSettings({ agreedToTerms: true })
  } else {
    await swapConfig.changeUserSettings({ agreedToTerms: false })
    await swapConfig.changeEnabled(false)
  }
  return result
}

type Props = {
  bridge: AirshipBridge<boolean>,
  swapInfo: EdgeSwapInfo,
  links: Array<{ text: string, uri: string }>
}

function SwapVerifyTermsModal (props: Props) {
  const { bridge, swapInfo, links } = props
  const { displayName, pluginName } = swapInfo
  const iconSize = THEME.rem(1.75)
  const linkStyle = dayText('small', 'link')

  return (
    <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <IconCircle>
        <Image source={swapPluginIcons[pluginName]} resizeMode={'contain'} style={{ height: iconSize, width: iconSize }} />
      </IconCircle>

      <ContentArea padding="wide">
        <Text style={dayText('title')}>{displayName}</Text>
        <Text style={dayText()}>{s.strings.swap_terms_statement}</Text>
        <PrimaryButton onPress={() => bridge.resolve(true)}>
          <PrimaryButton.Text>{s.strings.swap_terms_accept_button}</PrimaryButton.Text>
        </PrimaryButton>
        <SecondaryButton onPress={() => bridge.resolve(false)}>
          <SecondaryButton.Text>{s.strings.swap_terms_reject_button}</SecondaryButton.Text>
        </SecondaryButton>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {links.map(({ text, uri }) => (
            <Text style={linkStyle} key={text} onPress={() => Linking.openURL(uri)}>
              {text}
            </Text>
          ))}
        </View>
      </ContentArea>
    </AirshipModal>
  )
}
