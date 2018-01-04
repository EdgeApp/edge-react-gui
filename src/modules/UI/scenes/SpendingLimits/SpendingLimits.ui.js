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
import s from '../../../../locales/strings.js'

const PER_DAY_SPENDING_LIMITS_TEXT             = s.strings.per_day_spending_limit
const PER_DAY_SPENDING_LIMITS_DESCRIPTION_TEXT = s.strings.per_day_spending_limit_description
const PER_TRANSACTION_SPENDING_LIMITS_TEXT     = s.strings.per_transaction_spending_limit
const PER_TRANSACTION_SPENDING_LIMITS_DESCRIPTION_TEXT = s.strings.per_transaction_spending_limit_description
const ENTER_YOUR_PASSWORD_TEXT                 = s.strings.enter_your_password

import THEME from '../../../../theme/variables/airbitz'

type Props = {
  pluginName: string
}
type State = {}
export default class SpendingLimits extends Component<Props, State> {

  render () {
    return <View>
      <Gradient style={styles.gradient}/>
      <KeyboardAwareScrollView>

      <T key={1} style={styles.header}>
        {`Set Spending Limits for ${s.strings[this.props.pluginName]}`}
      </T>

      <View style={styles.form}>
        <View style={styles.formSection}>
          <FormField
            style={{borderWidth: 0, marginTop: 0, paddingTop: 0}}
            returnKeyType={'done'}
            label={ENTER_YOUR_PASSWORD_TEXT}
            autoCorrect={false}
            autoFocus={false} />
        </View>

        <View style={styles.formSection}>
          {this.renderDailySpendingLimitRow()}
          <FormField
            returnKeyType={'done'}
            autoCorrect={false}
            label={PER_DAY_SPENDING_LIMITS_TEXT} />
        </View>

        <View style={styles.formSection}>
          {this.renderTxSpendingLimitRow()}
          <FormField
            autoCorrect={false}
            label={PER_TRANSACTION_SPENDING_LIMITS_TEXT} />
        </View>
      </View>

      <PrimaryButton text={'Save'} style={styles.submitButton} />
    </KeyboardAwareScrollView>
  </View>
  }

  renderDailySpendingLimitRow () {
    const left = <View>
      <T key={1} style={{fontSize: 16, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>{PER_DAY_SPENDING_LIMITS_TEXT}</T>
      <T key={2} style={{fontSize: 14, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>{PER_DAY_SPENDING_LIMITS_DESCRIPTION_TEXT}</T>
    </View>

    return <RowSwitch style={stylesRaw.rowSwitch} leftText={left} onToggle={() => {}} />
  }

  renderTxSpendingLimitRow () {
    const left = <View>
      <T key={1} style={{fontSize: 16, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>{PER_TRANSACTION_SPENDING_LIMITS_TEXT}</T>
      <T key={2} style={{fontSize: 14, color: THEME.COLORS.GRAY_1, marginLeft: -18}}>{PER_TRANSACTION_SPENDING_LIMITS_DESCRIPTION_TEXT}</T>
    </View>

    return <RowSwitch style={stylesRaw.rowSwitch} leftText={left} onToggle={() => {}} />
  }
}
