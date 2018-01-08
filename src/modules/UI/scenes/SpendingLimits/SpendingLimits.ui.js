// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import Gradient from '../../components/Gradient/Gradient.ui'
import styles, {stylesRaw} from './styles'

import {PrimaryButton}  from '../../components/Buttons'
import RowSwitch from '../Settings/components/RowSwitch.ui'
import T from '../../components/FormattedText/FormattedText.ui'
import {FormField} from '../../../../components/FormField.js'
import {PasswordComponent} from '../../../../components/materialWrappers/PasswordComponent'
import s from '../../../../locales/strings.js'

const PER_DAY_SPENDING_LIMITS_TEXT             = s.strings.per_day_spending_limit
const PER_DAY_SPENDING_LIMITS_DESCRIPTION_TEXT = s.strings.per_day_spending_limit_description
const PER_TRANSACTION_SPENDING_LIMITS_TEXT     = s.strings.per_transaction_spending_limit
const PER_TRANSACTION_SPENDING_LIMITS_DESCRIPTION_TEXT = s.strings.per_transaction_spending_limit_description
const ENTER_PASSWORD_TO_MAKE_CHANGES_TEXT      = s.strings.enter_password_to_make_changes

import THEME from '../../../../theme/variables/airbitz'

type Props = {
  pluginName: string,
  currencyCode: string,
  dailySpendingLimit: {
    isEnabled: boolean,
    nativeAmount: string,
  },
  transactionSpendingLimit: {
    isEnabled: boolean,
    nativeAmount: string,
  },
  isTransactionSpendingLimitEnabled: boolean,
  isAuthorized: boolean,
  updateDailySpendingLimit: (currencyCode: string, isEnabled: boolean, dailySpendingLimit: string) => void,
  updateTransactionSpendingLimit: (currencyCode: string, isEnabled: boolean, dailySpendingLimit: string) => void,
  authorizeWithPassword: (password: string) => void
}
type State = {
  isDirty: boolean,
  isTransactionSpendingLimitEnabled: boolean,
  transactionSpendingLimitNativeAmount: string,
  dailySpendingLimitNativeAmount: string,
  isDailySpendingLimitEnabled: boolean,
}
export default class SpendingLimits extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      isDirty: false,
      isTransactionSpendingLimitEnabled: props.transactionSpendingLimit.isEnabled,
      transactionSpendingLimitNativeAmount: props.transactionSpendingLimit.nativeAmount,
      dailySpendingLimitNativeAmount: props.dailySpendingLimit.nativeAmount,
      isDailySpendingLimitEnabled: props.dailySpendingLimit.isEnabled
    }
  }

  render () {
    return <View>
      <Gradient style={styles.gradient}/>
      <KeyboardAwareScrollView>

      <T key={1} style={styles.header}>
        {`Set Spending Limits for ${s.strings[this.props.pluginName]}`}
      </T>

      <View style={styles.form}>
        <View style={styles.formSection}>
          <PasswordComponent
            style={{borderWidth: 0, marginTop: 0, paddingTop: 0}}
            returnKeyType={'done'}
            label={ENTER_PASSWORD_TO_MAKE_CHANGES_TEXT}
            autoCorrect={false}
            autoFocus={false}
            onChangeText={this.props.authorizeWithPassword}
            secureTextEntry />
        </View>

        <View style={styles.formSection}>
          {this.renderDailySpendingLimitRow()}
          <FormField
            disabled={!this.props.isAuthorized || !this.state.isDailySpendingLimitEnabled}
            onChangeText={this.updateDailySpendingLimitNativeAmount}
            value={this.state.dailySpendingLimitNativeAmount || ''}
            returnKeyType={'done'}
            keyboardType={'numeric'}
            autoCorrect={false}
            label={PER_DAY_SPENDING_LIMITS_TEXT} />
        </View>

        <View style={styles.formSection}>
          {this.renderTxSpendingLimitRow()}
          <FormField
            disabled={!this.props.isAuthorized || !this.state.isTransactionSpendingLimitEnabled}
            onChangeText={this.updateTransactionSpendingLimitNativeAmount}
            value={this.state.transactionSpendingLimitNativeAmount || ''}
            returnKeyType={'done'}
            autoCorrect={false}
            keyboardType={'numeric'}
            label={PER_TRANSACTION_SPENDING_LIMITS_TEXT} />
        </View>
      </View>

      <PrimaryButton
        text={'Save'}
        style={styles.submitButton}
        onPressFunction={this.onSubmit}
        disabled={!this.props.isAuthorized || !this.state.isDirty} />

    </KeyboardAwareScrollView>
  </View>
  }

  renderDailySpendingLimitRow () {
    const left = <View>
      <T key={1} style={{fontSize: 16, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>
        {PER_DAY_SPENDING_LIMITS_TEXT}
      </T>
      <T key={2} style={{fontSize: 14, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>
        {PER_DAY_SPENDING_LIMITS_DESCRIPTION_TEXT}
      </T>
    </View>

    return <RowSwitch style={stylesRaw.rowSwitch}
      onToggle={this.updateIsDailySpendingLimitEnabled}
      value={this.state.isDailySpendingLimitEnabled}
      leftText={left}
      disabled={!this.props.isAuthorized} />
  }

  renderTxSpendingLimitRow () {
    const left = <View>
      <T key={1} style={{fontSize: 16, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>
        {PER_TRANSACTION_SPENDING_LIMITS_TEXT}
      </T>
      <T key={2} style={{fontSize: 14, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>
        {PER_TRANSACTION_SPENDING_LIMITS_DESCRIPTION_TEXT}
      </T>
    </View>

    return <RowSwitch style={stylesRaw.rowSwitch}
      onToggle={this.updateIsTransactionSpendingLimitEnabled}
      value={this.state.isTransactionSpendingLimitEnabled}
      leftText={left}
      disabled={!this.props.isAuthorized} />
  }

  updateIsTransactionSpendingLimitEnabled = (isEnabled: boolean) => {
    this.setState({isDirty: true})
    return this.setState({isTransactionSpendingLimitEnabled: isEnabled})
  }

  updateTransactionSpendingLimitNativeAmount = (transactionSpendingLimitNativeAmount: string) => {
    this.setState({isDirty: true})
    return this.setState({transactionSpendingLimitNativeAmount})
  }

  updateIsDailySpendingLimitEnabled = (isEnabled: boolean) => {
    this.setState({isDirty: true})
    return this.setState({isDailySpendingLimitEnabled: isEnabled})
  }

  updateDailySpendingLimitNativeAmount = (dailySpendingLimitNativeAmount: string) => {
    this.setState({isDirty: true})
    return this.setState({dailySpendingLimitNativeAmount})
  }

  onSubmit = () => {
    const {
      isDailySpendingLimitEnabled,
      dailySpendingLimitNativeAmount,
      isTransactionSpendingLimitEnabled,
      transactionSpendingLimitNativeAmount
    } = this.state
    const {currencyCode} = this.props

    this.props.updateDailySpendingLimit(currencyCode, isDailySpendingLimitEnabled, dailySpendingLimitNativeAmount)
    this.props.updateTransactionSpendingLimit(currencyCode, isTransactionSpendingLimitEnabled, transactionSpendingLimitNativeAmount)
  }
}
