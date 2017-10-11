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
import helpImage from '../../../../assets/images/modal/help.png'
import packageJson from '../../../../../package.json'
import DeviceInfo from 'react-native-device-info'
import {PrimaryButton} from '../Buttons'
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

  }

  render () {
    console.log('this.props', this.props)
    return (
      <StylizedModal
        style={styles.stylizedModal}
        visibilityBoolean={this.props.modal}
        headerText='help_modal_title'
        modalMiddle={<WebView style={{height: 220, width: '100%'}} source={HTML} />}
        modalBottom={<View style={[styles.modalBottomContainer]}>
                        <Text style={styles.modalBottomText}>{strings.enUS['help_version']} {deviceInfo}</Text>
                        <View style={styles.closeButtonWrap}>
                          <PrimaryButton style={[styles.closeButton, UTILS.border()]} text={strings.enUS['string_done_cap']} onPressFunction={this.props.closeModal} />
                        </View>
                    </View>}
        featuredIcon={<Image source={helpImage}  style={styles.modalFeaturedIcon} color={THEME.secondary} size={20} />}
      />
    )
  }
}
