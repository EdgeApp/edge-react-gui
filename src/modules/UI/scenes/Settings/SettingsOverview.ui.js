// import HockeyApp from 'react-native-hockeyapp'

import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {ScrollView, View} from 'react-native'
import T from '../../components/FormattedText'
import {SettingsItemWithRoute, SettingsItemWithModal, SettingsItemWithSwitch} from './SettingsItems.ui'
import {PrimaryButton} from '../../components/Buttons'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import {Actions} from 'react-native-router-flux'
import s from './style'
import {border as b} from '../../../utils'

import {
  setAutoLogoutTimeRequest,
  setDefaultFiatRequest,
  setMerchantModeRequest,
  setBitcoinDenominationRequest,
  setBitcoinOverrideServerRequest,
  setEthereumDenominationRequest
} from './action.js'

class SettingsOverview extends Component {
  constructor (props) {
    super(props)

    this.settings = [
      {
        key: 'changePassword',
        text: sprintf(strings.enUS['settings_button_change_password']),
        routeFunction: this._onPressDummyRouting
      }, {
        key: 'changePin',
        text: sprintf(strings.enUS['settings_button_pin']),
        routeFunction: this._onPressDummyRouting
      }, {
        key: 'passwordRecovery',
        text: sprintf(strings.enUS['settings_button_change_pass_recovery']),
        routeFunction: this._onPressDummyRouting
      }
    ]

    this.securityRoute = [
      {
        key: 'setup2Factor',
        text: sprintf(strings.enUS['settings_button_setup_two_factor']),
        routeFunction: this._onPressDummyRouting
      }
    ]

    this.options = {
      pinRelogin: {
        text: sprintf(strings.enUS['settings_title_pin_login']),
        key: 'pinRelogin'
      },
      useTouchID: {
        text: sprintf(strings.enUS['settings_button_use_touchID']),
        key: 'useTouchID'
      }
    }

    this.optionModals = [
      {
        key: 'autoLogoff',
        text: sprintf(strings.enUS['settings_title_auto_logoff'])
      }
    ]

    this.currencies = [
      {
        key: 'btcSettings',
        text: 'Bitcoin',
        routeFunction: Actions.btcSettings
      }, {
        key: 'ethSettings',
        text: 'Ethereum',
        routeFunction: Actions.ethSettings
      }
    ]
  }

  _handleOnPressRouting = (route) => {
    console.log('in SettingsOverview.ui.js, route is: ', route)
    let goRoute = Actions[route]
    goRoute()
  }

  _onPressDummyRouting = () => {
    console.log('dummy routing')
  }

  _onPressOpenLogoffTime = () => {
    console.log('opening auto log off modal')
  }

  _onPressOpenDefaultCurrency = () => {
    console.log('opening default currency modal?')
  }

  _onPressOpenChangeCategories = () => {
    console.log('open change categories thingy')
  }

  _onToggleOption = (property) => {
    console.log('toggling option: ', property)
  }

  _onPressDebug = () => {
    // HockeyApp.generateTestCrash()
  }

  render () {
    return (
      <ScrollView style={s.container}>
        <LinearGradient style={[s.unlockRow]} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          colors={['#3B7ADA', '#2B5698']}>
          <View style={[s.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={s.leftArea}>
              <FAIcon style={[s.userIcon, b('green')]} name='user-o' color='white' />
              <T style={s.accountBoxHeaderText}>
                {sprintf(strings.enUS['settings_account_title_cap'])}: Airbitz Super Dooper Wallet
              </T>
            </View>
          </View>
        </LinearGradient>

        <View>
          {this.settings.map(this.renderSettingsItemWithRoute)}
        </View>

        <LinearGradient style={[s.unlockRow]} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          colors={['#3B7ADA', '#2B5698']}>
          <View style={[s.accountBoxHeaderTextWrap, b('yellow')]}>
            <View style={s.leftArea}>
              <IonIcon name='ios-options' style={[s.userIcon, b('green')]} color='white' />
              <T style={s.accountBoxHeaderText}>
                {sprintf(strings.enUS['settings_options_title_cap'])}
              </T>
            </View>
          </View>
        </LinearGradient>

        <View>
          {this.optionModals.map(this.renderSettingsItemWithModal)}
          {this.securityRoute.map(this.renderSettingsItemWithRoute)}
          {Object.keys(this.options).map(this.renderSettingsItemWithSwitch)}
          {this.currencies.map(this.renderSettingsItemWithRoute)}
          <View style={[s.debugArea, b('green')]}>
            <PrimaryButton text={sprintf(strings.enUS['settings_button_debug'])} onPressFunction={this._onPressDebug} />
          </View>
          <View style={s.emptyBottom} />
        </View>
      </ScrollView>
    )
  }

  renderSettingsItemWithRoute = (x, i) => {
    return <SettingsItemWithRoute leftText={x.text} key={i} scene={x.key} routeFunction={x.routeFunction} />
  }

  renderSettingsItemWithSwitch = (x) => {
    return <SettingsItemWithSwitch leftText={this.options[x].text} key={this.options[x].key} property={this.options[x].key} />
  }

  renderSettingsItemWithModal = (x) => {
    return <SettingsItemWithModal leftText={x.text} key={x.key} modal={x.key} />
  }
}

const mapStateToProps = state => ({settingsFile: state.core.account.folder.file('settings.json')})
const mapDispatchToProps = dispatch => ({
  setAutoLogoutTime: autoLogoffTimeInSeconds => {
    dispatch(setAutoLogoutTimeRequest(autoLogoffTimeInSeconds))
  },
  setDefaultFiat: defaultFiat => {
    dispatch(setDefaultFiatRequest(defaultFiat))
  },
  setMerchantMode: merchantMode => {
    dispatch(setMerchantModeRequest(merchantMode))
  },
  setBitcoinDenomination: denomination => {
    dispatch(setBitcoinDenominationRequest(denomination))
  },
  setBitcoinOverrideServer: overrideServer => {
    dispatch(setBitcoinOverrideServerRequest(overrideServer))
  },
  setEthereumDenomination: denomination => {
    dispatch(setEthereumDenominationRequest(denomination))
  }
})

const SettingsOverviewConnect = connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
export default SettingsOverviewConnect
