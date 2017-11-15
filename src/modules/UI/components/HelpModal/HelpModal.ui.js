import React, {Component} from 'react'
import {
  View,
  Image,
  WebView,
  Text,
  Linking,
  Platform
} from 'react-native'
import strings from '../../../../locales/default'
import styles from './style.js'
import StylizedModal from '../Modal/index.js'
import THEME from '../../../../theme/variables/airbitz.js'
import helpImage from '../../../../assets/images/modal/help.png'
import DeviceInfo from 'react-native-device-info'

const buildNumber = DeviceInfo.getBuildNumber()
const versionNumber = DeviceInfo.getVersion()
const CONTENT_URI = 'https://edgesecure.co/info.html'
const contentScaling = (Platform.OS === 'ios') ? false : true

export default class HelpModal extends Component {

  render () {
    return (
      <StylizedModal
        style={styles.stylizedModal}
        visibilityBoolean={this.props.modal}
        onExitButtonFxn={this.props.closeModal}
        headerText='help_modal_title'
        modalMiddle={<WebView ref={(ref) => { this.webview = ref }} scalesPageToFit={contentScaling} style={styles.webView} source={{uri: CONTENT_URI}}
          onNavigationStateChange={(event) => {
            if (!event.url.includes('info.html')) { // if NOT initial URL
              this.webview.stopLoading() // do not load in WebView
              Linking.openURL(event.url) // load externally
              this.props.closeModal()
            }
          }} />}
        modalBottom={<View style={[styles.modalBottomContainer]}>
                        <Text style={styles.modalBottomText}>{strings.enUS['help_version']} {versionNumber}</Text>
                        <Text style={styles.modalBottomText}>{strings.enUS['help_build']} {buildNumber}</Text>
                    </View>}
        featuredIcon={<Image source={helpImage}  style={styles.modalFeaturedIcon} color={THEME.secondary} size={20} />}
      />
    )
  }
}