// @flow

import React, { Component } from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { WebView } from 'react-native-webview'

import s from '../../locales/strings.js'
import THEME from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge } from '../common/Airship.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { IconCircle } from '../common/IconCircle'
import { Airship } from '../services/AirshipInstance.js'

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
          <AntDesignIcon name={'question'} size={scale(32)} color={THEME.COLORS.SECONDARY} style={styles.icon} />
        </IconCircle>

        <Text style={styles.title}>{s.strings.help_modal_title}</Text>
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
        <Text style={styles.versionText}>
          {s.strings.help_version} {versionNumber}
          {'\n'}
          {s.strings.help_build} {buildNumber}
        </Text>

        <TouchableOpacity style={styles.exitButton} onPress={() => bridge.resolve()}>
          <EntypoIcon name={'chevron-thin-down'} size={scale(22)} color={THEME.COLORS.GRAY_1} />
        </TouchableOpacity>
      </AirshipModal>
    )
  }
}

const styles = StyleSheet.create({
  icon: {
    // Optical illusion: being slightly off-center *looks* more centered
    marginLeft: scale(1.5)
  },
  title: {
    color: THEME.COLORS.PRIMARY,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: scale(18),
    margin: scale(12),
    textAlign: 'center'
  },
  versionText: {
    color: THEME.COLORS.GRAY_1,
    lineHeight: scale(18),
    textAlign: 'center',
    fontSize: scale(12),
    margin: scale(12)
  },
  exitButton: {
    alignItems: 'center'
  }
})
