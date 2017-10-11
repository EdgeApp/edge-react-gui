import React, {Component} from 'react'
import {
  View,
  Image,
  WebView,
  Text
} from 'react-native'
import strings from '../../../../locales/default'
import styles from './style.js'
import StylizedModal from '../Modal/index.js'
import THEME from '../../../../theme/variables/airbitz.js'
import PLATFORM from '../../../../theme/variables/platform.js'
import helpImage from '../../../../assets/images/modal/help.png'
import packageJson from '../../../../../package.json'
import DeviceInfo from 'react-native-device-info'
import * as UTILS from '../../../utils.js'
const HTML = require('../../../../html/enUS/info.html')

const buildNumber = DeviceInfo.getBuildNumber()
const deviceInfo = packageJson.version + ' ' + buildNumber

export default class HelpModal extends Component {
  respondToOnMessage = (e) => {
    console.log(e)
  }

  _renderWebView = () => {
    require('../../../../html/enUS/info.html')
  }

  _renderModalBottom = () => {
    <View style={[styles.modalBottomContainer, UTILS.border()]}>
      <Text>{strings.enUS['help_version']} {deviceInfo}</Text>
    </View>
  }

  render () {
    console.log('this.props', this.props)
    return (
      <StylizedModal
        style={{height: (PLATFORM.deviceHeight * 2 / 3)}}
        visibilityBoolean={this.props.modal}
        headerText='help_modal_title'
        modalMiddle={<WebView style={{height: 250, width: '100%'}} source={HTML} />}
        modalBottom={this._renderModalBottom()}
        featuredIcon={<Image source={helpImage}  style={{top: 24, left: 24}} color={THEME.secondary} size={20} />}
      />
    )
  }
}
