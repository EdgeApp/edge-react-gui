// @flow

import type { EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import { type Action } from '../../modules/ReduxTypes.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/SettingsStyle'
import { getTimeWithMeasurement } from '../../util/utils'
import { launchModal } from '../common/ModalProvider.js'
import RowModal from '../common/RowModal'
import RowRoute from '../common/RowRoute'
import RowSwitch from '../common/RowSwitch'
import { createAutoLogoutModal } from '../modals/AutoLogoutModal.ui'

const DISABLE_TEXT = s.strings.string_disable

type Props = {
  defaultFiat: string,
  autoLogoutTimeInMinutes: number,
  username: string,
  account: EdgeAccount,
  pinLoginEnabled: boolean,
  supportsTouchId: boolean,
  touchIdEnabled: boolean,
  lockButton: string,
  lockButtonIcon: string,
  isLocked: boolean,
  confirmPasswordError: string,
  developerModeOn: boolean,
  setAutoLogoutTimeInMinutes(number): void,
  confirmPassword(string): void,
  lockSettings(): void,
  dispatchUpdateEnableTouchIdEnable(boolean, EdgeAccount): void,
  resetConfirmPasswordError(Object): void,
  onTogglePinLoginEnabled(enableLogin: boolean): void,
  otpResetDate: string,
  showReEnableOtpModal: () => Promise<Action>,
  showUnlockSettingsModal: () => void,
  showSendLogsModal: () => void,
  showRestoreWalletsModal: () => void,
  turnOnDeveloperMode(): void,
  turnOffDeveloperMode(): void
}
type State = {
  showAutoLogoutModal: boolean,
  autoLogoutTimeInMinutes: number
}

export default class SettingsOverview extends Component<Props, State> {
  optionModals: Array<Object>
  currencies: Array<Object>
  options: Object
  constructor (props: Props) {
    super(props)
    this.state = {
      showAutoLogoutModal: false,
      autoLogoutTimeInMinutes: props.autoLogoutTimeInMinutes
    }

    const useTouchID = this.props.supportsTouchId
      ? {
        text: s.strings.settings_button_use_touchID,
        key: 'useTouchID',
        routeFunction: this._onToggleTouchIdOption,
        value: this.props.touchIdEnabled
      }
      : null
    if (useTouchID) {
      this.options = { useTouchID }
    } else {
      this.options = {}
    }

    this.optionModals = [
      {
        key: 'autoLogoff',
        text: s.strings.settings_title_auto_logoff
      }
    ]

    this.currencies = []
    for (const currencyKey in Constants.CURRENCY_SETTINGS) {
      const { pluginName } = Constants.CURRENCY_SETTINGS[currencyKey]
      this.currencies.push({
        text: pluginName.charAt(0).toUpperCase() + pluginName.slice(1),
        routeFunction: Actions[currencyKey]
      })
    }
  }

  _onPressDummyRouting = () => {}

  unlockSettingsAlert = () => Alert.alert(null, s.strings.settings_alert_unlock, [{ text: s.strings.string_ok }])
  _onPressChangePasswordRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.CHANGE_PASSWORD]()
  }
  _onPressChangePinRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.CHANGE_PIN]()
  }
  _onPressOtp = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.OTP_SETUP]()
  }
  _onPressRecoverPasswordRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.RECOVER_PASSWORD]()
  }

  _onPressExchangeSettings = () => {
    Actions[Constants.EXCHANGE_SETTINGS]()
  }

  _onPressSpendingLimits = () => {
    return Actions[Constants.SPENDING_LIMITS]()
  }

  _onPressOpenLogoffTime = () => {}

  _onPressOpenDefaultCurrency = () => {}

  _onPressOpenChangeCategories = () => {}

  _onToggleTouchIdOption = (bool: boolean) => {
    this.props.dispatchUpdateEnableTouchIdEnable(bool, this.props.account)
    this.options.useTouchID.value = bool
  }

  onDeveloperPress = () => {
    if (this.props.developerModeOn) {
      this.props.turnOffDeveloperMode()
      return
    }
    this.props.turnOnDeveloperMode()
  }

  showAutoLogoutModal = async () => {
    const modal = createAutoLogoutModal({
      autoLogoutTimeInMinutes: this.state.autoLogoutTimeInMinutes
    })

    const autoLogoutTimeInMinutes = await launchModal(modal)
    if (autoLogoutTimeInMinutes) {
      this.setState({
        autoLogoutTimeInMinutes
      })
      this.props.setAutoLogoutTimeInMinutes(autoLogoutTimeInMinutes)
    }
  }

  render () {
    const { measurement: autoLogoutMeasurement, value: autoLogoutValue } = getTimeWithMeasurement(this.state.autoLogoutTimeInMinutes)
    const autoLogoutRightText = autoLogoutValue === 0 ? DISABLE_TEXT : `${autoLogoutValue} ${s.strings['settings_' + autoLogoutMeasurement]}`
    const developerModeText = this.props.developerModeOn ? s.strings.settings_turn_off_developer_mode : s.strings.settings_turn_on_developer_mode
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.container}>
          <Gradient style={[styles.unlockRow]}>
            <View style={[styles.accountBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <Icon type={Constants.FONT_AWESOME} style={[styles.icon]} name={Constants.USER_O} />
                <T style={styles.accountBoxHeaderText}>
                  {s.strings.settings_account_title_cap}: {this.props.username}
                </T>
              </View>
            </View>
          </Gradient>
          <RowRoute
            leftText={s.strings[this.props.lockButton]}
            disabled={false}
            routeFunction={this.showConfirmPasswordModal}
            right={<Icon style={styles.settingsLocks} name={this.props.lockButtonIcon} size={24} type={Constants.ION_ICONS} />}
          />
          <RowRoute
            leftText={s.strings.settings_button_change_password}
            disabled={this.props.isLocked}
            routeFunction={this._onPressChangePasswordRouting}
            right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
          />
          <RowRoute
            leftText={s.strings.settings_button_pin}
            disabled={this.props.isLocked}
            routeFunction={this._onPressChangePinRouting}
            right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
          />
          <RowRoute
            leftText={s.strings.settings_button_setup_two_factor}
            disabled={this.props.isLocked}
            routeFunction={this._onPressOtp}
            right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
          />
          <RowRoute
            leftText={s.strings.settings_button_password_recovery}
            disabled={this.props.isLocked}
            routeFunction={this._onPressRecoverPasswordRouting}
            right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
          />

          <Gradient style={[styles.unlockRow]}>
            <View style={[styles.accountBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <Icon type={Constants.ION_ICONS} name="ios-options" style={[styles.icon]} />
                <T style={styles.accountBoxHeaderText}>{s.strings.settings_options_title_cap}</T>
              </View>
            </View>
          </Gradient>

          <View>
            <RowRoute
              disabled={false}
              leftText={s.strings.settings_exchange_settings}
              routeFunction={this._onPressExchangeSettings}
              right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
            />

            <RowRoute
              disabled={false}
              leftText={s.strings.spending_limits}
              routeFunction={this._onPressSpendingLimits}
              right={<Icon type={Constants.SIMPLE_ICONS} style={styles.settingsRowRightArrow} name={Constants.ARROW_RIGHT} />}
            />

            <RowModal onPress={this.showAutoLogoutModal} leftText={s.strings.settings_title_auto_logoff} rightText={autoLogoutRightText} />

            <RowRoute
              disabled={false}
              leftText={s.strings.settings_title_currency}
              routeFunction={Actions.defaultFiatSetting}
              right={<Text>{this.props.defaultFiat.replace('iso:', '')}</Text>}
            />

            <RowSwitch
              leftText={s.strings.settings_title_pin_login}
              key="pinRelogin"
              onToggle={this.props.onTogglePinLoginEnabled}
              value={this.props.pinLoginEnabled}
            />

            {Object.keys(this.options)
              .filter(optionName => {
                if (!this.options[optionName]) return false
                const { text, key, routeFunction } = this.options[optionName]
                return text && key && routeFunction
              })
              .map(this.renderRowSwitch)}

            {this.currencies.map(this.renderRowRoute)}

            <RowRoute disabled={false} leftText={s.strings.settings_button_send_logs} routeFunction={this.showSendLogsModal} />

            <RowModal onPress={this.showRestoreWalletModal} leftText={s.strings.restore_wallets_modal_title} />

            <RowRoute
              disabled={false}
              leftText={s.strings.title_terms_of_service}
              scene={Constants.TERMS_OF_SERVICE}
              routeFunction={Actions[Constants.TERMS_OF_SERVICE]}
            />

            <View style={[styles.debugArea]}>
              <PrimaryButton onPress={this.onDeveloperPress}>
                <PrimaryButton.Text>{developerModeText}</PrimaryButton.Text>
              </PrimaryButton>
            </View>

            <View style={styles.emptyBottom} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  showConfirmPasswordModal = () => {
    if (!this.props.isLocked) {
      this.props.lockSettings()
    } else {
      this.props.showUnlockSettingsModal()
    }
  }

  showSendLogsModal = () => {
    this.props.showSendLogsModal()
  }

  showRestoreWalletModal = () => {
    this.props.showRestoreWalletsModal()
  }

  renderRowRoute = (x: Object, i: number) => <RowRoute disabled={false} key={i} leftText={x.text} routeFunction={x.routeFunction} right={x.right} />

  renderRowSwitch = (x: string) => (
    <RowSwitch
      leftText={this.options[x] ? this.options[x].text : ''}
      key={this.options[x] ? this.options[x].key : ''}
      property={this.options[x] ? this.options[x].key : ''}
      onToggle={this.options[x] ? this.options[x].routeFunction : () => {}}
      value={this.options[x] ? this.options[x].value : false}
    />
  )

  renderRowModal = (x: Object) => <RowModal leftText={x.text} key={x.key} modal={x.key.toString()} />
}
