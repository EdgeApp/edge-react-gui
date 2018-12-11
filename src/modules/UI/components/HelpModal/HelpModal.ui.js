// @flow

import React, { Component } from 'react'
import { Dimensions, Image, Linking, Platform, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { WebView } from 'react-native-webview'

import helpImage from '../../../../assets/images/modal/help.png'
import { isIphoneX } from '../../../../lib/isIphoneX.js'
import s from '../../../../locales/strings.js'
import THEME from '../../../../theme/variables/airbitz.js'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import StylizedModal from '../Modal/index.js'
import styles from './style.js'

const buildNumber = DeviceInfo.getBuildNumber()
const versionNumber = DeviceInfo.getVersion()
const CONTENT_URI = 'https://edgesecure.co/info.html'
const contentScaling = Platform.OS !== 'ios'

type Props = {
  modal: any,
  closeModal: () => void
}

export default class HelpModal extends Component<Props> {
  getRef = (ref: any) => {
    // $FlowFixMe
    this.webview = ref
  }

  render () {
    const deviceWidth = Dimensions.get('window').width
    const deviceHeight = Dimensions.get('window').height
    const width = PLATFORM.platform === 'ios' ? deviceWidth - 20 : '100%'
    const height = isIphoneX ? deviceHeight - 120 : deviceHeight - 80
    return (
      <StylizedModal
        visibilityBoolean={this.props.modal}
        onExitButtonFxn={this.props.closeModal}
        headerText={s.strings.help_modal_title}
        modalMiddle={
          <WebView
            ref={this.getRef}
            scalesPageToFit={contentScaling}
            style={styles.webView}
            source={{ uri: CONTENT_URI }}
            onNavigationStateChange={event => {
              if (!event.url.includes('info.html')) {
                // if NOT initial URL
                // $FlowFixMe
                this.webview.stopLoading() // do not load in WebView
                Linking.openURL(event.url) // load externally
                this.props.closeModal()
              }
            }}
          />
        }
        style={styles.stylizedModal}
        modalHeaderIcon={styles.modalHeaderIcon}
        modalBodyStyle={styles.modalBodyStyle}
        modalVisibleStyle={[styles.modalVisibleStyle, { height, width }]}
        modalBoxStyle={styles.modalBoxStyle}
        modalContentStyle={styles.modalContentStyle}
        modalMiddleStyle={styles.modalMiddleWebView}
        modalBottom={
          <View style={[styles.modalBottomContainer]}>
            <Text style={styles.modalBottomText}>
              {s.strings.help_version} {versionNumber}
            </Text>
            <Text style={styles.modalBottomText}>
              {s.strings.help_build} {buildNumber}
            </Text>
          </View>
        }
        featuredIcon={<Image source={helpImage} color={THEME.COLORS.SECONDARY} size={20} />}
      />
    )
  }
}
