// import HockeyApp from 'react-native-hockeyapp'

import React, {Component} from 'react'
import {ScrollView, Text, View} from 'react-native'
import {Actions} from 'react-native-router-flux'

import FAIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import Gradient from '../../components/Gradient/Gradient.ui'

import * as Constants from '../../../../constants'
import strings from '../../../../locales/default'
import T from '../../components/FormattedText'
import RowModal from './components/RowModal.ui'
import RowRoute from './components/RowRoute.ui'
import RowSwitch from './components/RowSwitch.ui'
import {PrimaryButton} from '../../components/Buttons'
import {border as b} from '../../../utils'
import AutoLogoutModal from './components/AutoLogoutModal.ui'
import SendLogsModal from './components/SendLogsModal.ui'

import Icon from 'react-native-vector-icons/SimpleLineIcons'

import styles from './style'

const ACCOUNT_HEADER_TEXT   = strings.enUS['settings_account_title_cap']
const CHANGE_PASSWORD_TEXT  = strings.enUS['settings_button_change_password']
const CHANGE_PIN_TEXT       = strings.enUS['settings_button_pin']
const CHANGE_RECOVERY_TEXT  = strings.enUS['settings_button_change_pass_recovery']
const OPTIONS_HEADER_TEXT   = strings.enUS['settings_options_title_cap']
const AUTO_LOGOUT_TEXT      = strings.enUS['settings_title_auto_logoff']
const SEND_LOGS_TEXT        = strings.enUS['settings_button_send_logs']
const DEBUG_TEXT            = strings.enUS['settings_button_debug']
const DEFAULT_CURRENCY_TEXT = strings.enUS['settings_title_currency']
const DISABLE_TEXT          = strings.enUS['string_disable']

const SETUP_2FA_TEXT    = strings.enUS['settings_button_setup_two_factor']
const PIN_RE_LOGIN_TEXT = strings.enUS['settings_title_pin_login']
const TOUCH_ID_TEXT     = strings.enUS['settings_button_use_touchID']

export default class SettingsOverview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showAutoLogoutModal: false,
      showSendLogsModal: false,
      autoLogoutTimeInMinutes: props.autoLogoutTimeInMinutes
    }

    this.securityRoute = [
      {
        key: 'setup2Factor',
        text: SETUP_2FA_TEXT,
        routeFunction: this.onPressDummyRouting
      }
    ]

    this.options = {
      pinRelogin: {
        text: PIN_RE_LOGIN_TEXT,
        key: 'pinRelogin'
      },
      useTouchID: {
        text: TOUCH_ID_TEXT,
        key: 'useTouchID'
      }
    }

    this.currencies = [
      {
        key: 'btcSettings',
        text: 'Bitcoin',
        routeFunction: Actions.btcSettings
      },
      {
        key: 'ethSettings',
        text: 'Ethereum',
        routeFunction: Actions.ethSettings
      },
      {
        key: 'ltcSettings',
        text: 'Litecoin',
        routeFunction: Actions.ltcSettings
      },
      {
        key: 'bchSettings',
        text: 'BitcoinCash',
        routeFunction: Actions.bchSettings
      }
    ]
  }

  render () {
    return (
      <ScrollView style={styles.container}>
        <Gradient style={[styles.unlockRow]}>
          <View style={[styles.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={styles.leftArea}>
              <FAIcon style={[styles.userIcon, b('green')]}
                name='user-o'
                color='white' />
              <T style={styles.accountBoxHeaderText}>
                {`${ACCOUNT_HEADER_TEXT}: ${this.props.username}`}
              </T>
            </View>
          </View>
        </Gradient>

        <RowRoute
          leftText={CHANGE_PASSWORD_TEXT}
          scene={'changePassword'}
          routeFunction={this.onPressChangePasswordRouting}
          right={<Icon name='arrow-right' size={18} color='#58595C' />} />
        <RowRoute
          leftText={CHANGE_PIN_TEXT}
          scene={'changePassword'}
          routeFunction={this.onPressChangePinRouting}
          right={<Icon name='arrow-right' size={18} color='#58595C' />} />
        <RowRoute
          leftText={CHANGE_RECOVERY_TEXT}
          scene={'changePassword'}
          routeFunction={this.onPressRecoverPasswordRouting}
          right={<Icon name='arrow-right' size={18} color='#58595C' />} />

        <Gradient style={[styles.unlockRow]}>
          <View style={[styles.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={styles.leftArea}>
              <IonIcon name='ios-options' style={[styles.userIcon, b('green')]} color='white' />
              <T style={styles.accountBoxHeaderText}>
                {OPTIONS_HEADER_TEXT}
              </T>
            </View>
          </View>
        </Gradient>

        <View>
          <RowModal onPress={this.showAutoLogoutModal}
            leftText={AUTO_LOGOUT_TEXT}
            rightText={this.props.autoLogoutTimeInMinutes || DISABLE_TEXT} />

          <RowRoute
            leftText={DEFAULT_CURRENCY_TEXT}
            scene={'changePassword'}
            routeFunction={Actions.defaultFiatSetting}
            right={<Text>{this.props.defaultFiat.replace('iso:', '')}</Text>} />

          {this.securityRoute.map(this.renderRowRoute)}

          {Object.keys(this.options).map(this.renderRowSwitch)}

          {this.currencies.map(this.renderRowRoute)}

          <RowRoute
            leftText={SEND_LOGS_TEXT}
            scene={'changePassword'}
            routeFunction={this.showSendLogsModal} />

          <View style={[styles.debugArea, b('green')]}>
            <PrimaryButton text={DEBUG_TEXT} onPressFunction={this.onPressDebug} />
          </View>

          <View style={styles.emptyBottom} />
        </View>

        <AutoLogoutModal showModal={this.state.showAutoLogoutModal}
          onDone={this.onDoneAutoLogoutModal}
          onCancel={this.onCancelAutoLogoutModal} />
        <SendLogsModal showModal={this.state.showSendLogsModal}
          onDone={this.onDoneSendLogsModal}
          onCancel={this.onCancelSendLogsModal} />
      </ScrollView>
    )
  }

  onPressDummyRouting = () => {
    // console.log('dummy routing')
  }

  onPressChangePasswordRouting = () => {
    Actions[Constants.CHANGE_PASSWORD]()
  }

  onPressChangePinRouting = () => {
    Actions[Constants.CHANGE_PIN]()

  }
  onPressRecoverPasswordRouting = () => {
    Actions[Constants.CHANGE_PASSWORD]()
  }

  onDoneAutoLogoutModal = (autoLogoutTimeInMinutes) => {
    this.setState({
      showAutoLogoutModal: false,
      autoLogoutTimeInMinutes
    })
    this.props.setAutoLogoutTimeInMinutes(autoLogoutTimeInMinutes)
  }

  onCancelAutoLogoutModal = () => {
    this.setState({showAutoLogoutModal: false})
  }

  onDoneSendLogsModal = (text) => {
    this.setState({showSendLogsModal: false})
    this.props.sendLogs(text)
  }

  onCancelSendLogsModal = () => {
    this.setState({showSendLogsModal: false})
  }

  showAutoLogoutModal = () => this.setState({showAutoLogoutModal: true})

  showSendLogsModal = () => this.setState({showSendLogsModal: true})

  renderRowRoute = (x, i) => <RowRoute key={i} leftText={x.text} scene={x.key} routeFunction={x.routeFunction} right={x.right} />

  renderRowSwitch = (x) => <RowSwitch leftText={this.options[x].text} key={this.options[x].key} property={this.options[x].key} />

  renderRowModal = (x) => <RowModal leftText={x.text} key={x.key} modal={(x.key).toString()} />
}
