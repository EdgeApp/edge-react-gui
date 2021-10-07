// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { truncateDecimals, zeroString } from '../../util/utils.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'

type Props = {
  bridge: AirshipBridge<{ amountFiat: string }>,
  currency: string,
  amountFiat: string
}

type State = {
  amount: string
}

export class TransactionDetailsFiatInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { amount: props.amountFiat }
  }

  changeAmount = (amount: string) => {
    this.setState({ amount })
  }

  onFocus = () => {
    const { amount } = this.state
    this.changeAmount(amount !== '0.00' && amount !== '0,00' ? amount : '')
  }

  onBlur = () => {
    const { amount } = this.state
    if (parseFloat(amount)) {
      const absAmount = bns.abs(this.filter(amount))
      const fixedAmount = bns.toFixed(absAmount, 2, 2)
      this.changeAmount(fixedAmount)
    } else {
      this.changeAmount(formatNumber('0.00'))
    }
  }

  onChange = (value: string) => {
    const input = this.filter(value)
    const check = (isNaN(input.replace(',', '.')) && input !== ',' && input !== '.') || input === ''
    this.changeAmount(check ? '' : input)
  }

  render() {
    const { bridge, currency, amountFiat } = this.props
    const { amount } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve({ amountFiat })}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve({ amountFiat })}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{sprintf(s.strings.transaction_details_fiat_modal_header, currency)}</FormattedText>
            <FormField
              {...MaterialInputOnWhite}
              containerStyle={{
                ...MaterialInputOnWhite.containerStyle,
                width: '100%'
              }}
              autoFocus
              returnKeyType="done"
              autoCapitalize="none"
              keyboardType="numeric"
              label={s.strings.transaction_details_fiat_label}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              onChangeText={this.onChange}
              onSubmitEditing={() => {
                const amountFiat = zeroString(amount) ? '0.00' : amount
                bridge.resolve({ amountFiat })
              }}
              value={truncateDecimals(amount.replace('-', ''), 2, true)}
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

const rawStyles = {
  airshipContainer: {
    flex: 1,
    padding: THEME.rem(0.8)
  },
  airshipHeader: {
    fontSize: THEME.rem(1.2),
    marginBottom: THEME.rem(1),
    alignSelf: 'center'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
