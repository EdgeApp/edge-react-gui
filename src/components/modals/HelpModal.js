// @flow

import React, { Component } from 'react'
import { Linking, Text } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { WebView } from 'react-native-webview'

import s from '../../locales/strings.js'
import { Airship } from '../services/AirshipInstance.js'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, ModalCloseArrow, THEME, textStyles } from './modalParts.js'

const buildNumber = DeviceInfo.getBuildNumber()
const versionNumber = DeviceInfo.getVersion()
const CONTENT_URI = 'https://edgesecure.co/info.html'

export function showHelpModal (): Promise<mixed> {
  return Airship.show(bridge => <HelpModal bridge={bridge} />)
}

type Props = {
  bridge: AirshipBridge<mixed>
}

class HelpModal extends Component<Props> {
  webview: WebView | void

  render () {
    const { bridge } = this.props

    return (
      <AirshipModal bridge={bridge} hasIcon onCancel={() => bridge.resolve()}>
        <IconCircle>
          <AntDesignIcon name="question" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} style={{ marginLeft: THEME.rem(0.1) }} />
        </IconCircle>

        <ContentArea grow>
          <Text style={textStyles.bodyTitle}>{s.strings.help_modal_title}</Text>
          <WebView
            onNavigationStateChange={event => {
              if (!event.url.includes('info.html')) {
                if (this.webview) this.webview.stopLoading()
                Linking.openURL(event.url)
                bridge.resolve()
              }
            }}
            ref={element => (this.webview = element)}
            source={{ uri: CONTENT_URI }}
          />
          <Text style={[textStyles.bodyCenter, { fontSize: THEME.rem(0.8), lineHeight: THEME.rem(1.2) }]}>
            {s.strings.help_version} {versionNumber}
            {'\n'}
            {s.strings.help_build} {buildNumber}
          </Text>
        </ContentArea>

        <ModalCloseArrow onPress={() => bridge.resolve()} />
      </AirshipModal>
    )
  }
}
