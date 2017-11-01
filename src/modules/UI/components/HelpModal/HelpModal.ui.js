import React, {Component} from 'react'
import {
  View,
  Image,
  WebView,
  Text,
  Linking
} from 'react-native'
import strings from '../../../../locales/default'
import styles from './style.js'
import StylizedModal from '../Modal/index.js'
import THEME from '../../../../theme/variables/airbitz.js'
import helpImage from '../../../../assets/images/modal/help.png'
import DeviceInfo from 'react-native-device-info'

const HTML = require('../../../../html/enUS/info.html')

const buildNumber = DeviceInfo.getBuildNumber()
const versionNumber = DeviceInfo.getVersion()

export default class HelpModal extends Component {

  _renderWebView = () => {
    require('../../../../html/enUS/info.html')
  }

  render () {
    return (
      <StylizedModal
        style={styles.stylizedModal}
        visibilityBoolean={this.props.modal}
        onExitButtonFxn={this.props.closeModal}
        headerText='help_modal_title'
        modalMiddle={<WebView ref={(ref) => { this.webview = ref }} scalesPageToFit={false} style={{justifyContent: 'center', alignItems:'center', height: 240, flex: 1}} source={HTML}
          onNavigationStateChange={(event) => {
            if (!event.url.includes('assets/src/html/enUS/info.html')) {
              console.log('event is: ', event)
              this.webview.stopLoading()
              Linking.openURL(event.url)
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
