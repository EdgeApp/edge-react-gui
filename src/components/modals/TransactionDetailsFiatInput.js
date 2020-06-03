// @flow

import { bns } from 'biggystring'
import React, { PureComponent } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { intl } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles'
import THEME from '../../theme/variables/airbitz'
import type { State as StateType } from '../../types/reduxTypes.js'
import { truncateDecimals } from '../../util/utils.js'
import { FormField } from '../common/FormField.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

type OwnProps = {
  bridge: AirshipBridge<null>,
  currency: string,
  amount: string,
  onChange: string => void
}

type StateProps = {
  theme: EdgeTheme
}

type State = {
  amount: string,
  styles: StyleSheet
}

type Props = OwnProps & StateProps

class TransactionDetailsFiatInputComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      amount: props.amount,
      styles: getStyles(props.theme)
    }
  }

  static getDerivedStateFromProps(props: Props) {
    return { styles: getStyles(props.theme) }
  }

  changeAmount = (amount: string) => {
    this.props.onChange(amount)
    this.setState({ amount })
  }

  onFocus = () => {
    this.changeAmount(this.state.amount !== '0.00' && this.state.amount !== '0,00' ? this.state.amount : '')
  }

  onBlur = () => {
    const { amount } = this.state
    if (parseFloat(amount)) {
      const absAmount = bns.abs(this.filter(amount))
      const fixedAmount = bns.toFixed(absAmount, 2, 2)
      this.changeAmount(fixedAmount)
    } else {
      this.changeAmount(intl.formatNumber('0.00'))
    }
  }

  onChange = (value: string) => {
    const input = this.filter(value)
    const check = (isNaN(input.replace(',', '.')) && input !== ',' && input !== '.') || input === ''
    this.changeAmount(check ? '' : input)
  }

  render() {
    const { bridge, currency, theme } = this.props
    const { amount, styles } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.container}>
            <FormattedText style={styles.header}>{sprintf(s.strings.transaction_details_fiat_modal_header, currency)}</FormattedText>
            <FormField
              autoFocus
              returnKeyType="done"
              autoCapitalize="none"
              keyboardType="numeric"
              clearButtonMode="while-editing"
              label={s.strings.transaction_details_fiat_label}
              style={getMaterialFiatInput(theme)}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              onChangeText={this.onChange}
              onSubmitEditing={() => bridge.resolve(null)}
              value={truncateDecimals(amount.toString().replace('-', ''), 2, true)}
            />
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }

  filter = (value: string) => {
    return value
      .replace(/[^\d.,]/, '')
      .replace(/\./, 'x')
      .replace(/\./g, '')
      .replace(/x/, '.')
      .replace(/,/, 'x')
      .replace(/,/g, '')
      .replace(/x/, ',')
  }
}

export const TransactionDetailsFiatInput = connect((state: StateType): StateProps => ({ theme: state.theme }))(TransactionDetailsFiatInputComponent)

const { rem } = THEME
const getStyles = (theme: EdgeTheme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: rem(1),
      backgroundColor: theme.modalBody,
      borderTopLeftRadius: rem(1),
      borderTopRightRadius: rem(1)
    },
    header: {
      fontSize: rem(1.25),
      marginBottom: rem(1),
      alignSelf: 'center',
      color: theme.headerText
    }
  })
}

const getMaterialFiatInput = (theme: EdgeTheme) => {
  return {
    ...MaterialInputOnWhite,
    fontSize: rem(3),
    baseColor: theme.primaryText,
    tintColor: theme.materialInputTintColor,
    errorColor: theme.accentTextNegative,
    textColor: theme.primaryText,
    container: {
      ...MaterialInputOnWhite.container,
      width: '100%'
    }
  }
}
