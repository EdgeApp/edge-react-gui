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

import s from './style'

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
        text: strings.enUS['settings_button_setup_two_factor'],
        routeFunction: this._onPressDummyRouting
      }
    ]

    this.options = {
      pinRelogin: {
        text: strings.enUS['settings_title_pin_login'],
        key: 'pinRelogin'
      },
      useTouchID: {
        text: strings.enUS['settings_button_use_touchID'],
        key: 'useTouchID'
      }
    }

    this.optionModals = [
      {
        key: 'autoLogoff',
        text: strings.enUS['settings_title_auto_logoff']
      }
    ]

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

  _onPressDummyRouting = () => {
    // console.log('dummy routing')
  }

  _onPressChangePasswordRouting = () => {
    Actions[Constants.CHANGE_PASSWORD]()
  }

  _onPressChangePinRouting = () => {
    Actions[Constants.CHANGE_PIN]()

  }
  _onPressRecoverPasswordRouting = () => {
    Actions[Constants.CHANGE_PASSWORD]()
  }

  _onPressOpenLogoffTime = () => {
    // console.log('opening auto log off modal')
  }

  _onPressOpenDefaultCurrency = () => {
    // console.log('opening default currency modal?')
  }

  _onPressOpenChangeCategories = () => {
    // console.log('open change categories thingy')
  }

  _onToggleOption = () => {
    // console.log('toggling option: ', property)
  }

  _onPressDebug = () => {
    // HockeyApp.generateTestCrash()
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

  render () {
    const disabled = strings.enUS['string_disable']

    return (
      <ScrollView style={s.container}>
        <Gradient style={[s.unlockRow]}>
          <View style={[s.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={s.leftArea}>
              <FAIcon style={[s.userIcon, b('green')]} name='user-o' color='white' />
              <T style={s.accountBoxHeaderText}>
                {strings.enUS['settings_account_title_cap']}: {this.props.username}
              </T>
            </View>
          </View>
        </Gradient>

        <RowRoute
          leftText={strings.enUS['settings_button_change_password']}
          scene={'changePassword'}
          routeFunction={this._onPressChangePasswordRouting}
          right={<Icon name='arrow-right' size={18}
            color='#58595C' />} />
        <RowRoute
          leftText={strings.enUS['settings_button_pin']}
          scene={'changePassword'}
          routeFunction={this._onPressChangePinRouting}
          right={<Icon name='arrow-right' size={18}
            color='#58595C' />} />
        <RowRoute
          leftText={strings.enUS['settings_button_change_pass_recovery']}
          scene={'changePassword'}
          routeFunction={this._onPressRecoverPasswordRouting}
          right={<Icon name='arrow-right' size={18}
            color='#58595C' />} />

        <Gradient style={[s.unlockRow]}>
          <View style={[s.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={s.leftArea}>
              <IonIcon name='ios-options' style={[s.userIcon, b('green')]} color='white' />
              <T style={s.accountBoxHeaderText}>
                {strings.enUS['settings_options_title_cap']}
              </T>
            </View>
          </View>
        </Gradient>

        <View>
          <RowModal onPress={this.showAutoLogoutModal}
            leftText={strings.enUS['settings_title_auto_logoff']}
            rightText={this.props.autoLogoutTimeInMinutes || disabled} />

          <RowRoute
            leftText={strings.enUS['settings_title_currency']}
            scene={'changePassword'}
            routeFunction={Actions.defaultFiatSetting}
            right={<Text>{this.props.defaultFiat.replace('iso:', '')}</Text>} />

          {this.securityRoute.map(this.renderRowRoute)}

          {Object.keys(this.options).map(this.renderRowSwitch)}

          {this.currencies.map(this.renderRowRoute)}

          <RowRoute
            leftText={strings.enUS['settings_button_send_logs']}
            scene={'changePassword'}
            routeFunction={this.showSendLogsModal}
           />

          <View style={[s.debugArea, b('green')]}>
            <PrimaryButton text={strings.enUS['settings_button_debug']} onPressFunction={this._onPressDebug} />
          </View>

          <View style={s.emptyBottom} />
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

  showAutoLogoutModal = () => this.setState({showAutoLogoutModal: true})

  showSendLogsModal = () => this.setState({showSendLogsModal: true})

  renderRowRoute = (x, i) => <RowRoute key={i} leftText={x.text} scene={x.key} routeFunction={x.routeFunction} right={x.right} />

  renderRowSwitch = (x) => <RowSwitch leftText={this.options[x].text} key={this.options[x].key} property={this.options[x].key} />

  renderRowModal = (x) => <RowModal leftText={x.text} key={x.key} modal={(x.key).toString()} />
}
