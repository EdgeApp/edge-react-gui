// @flow

import { Gradient, Scene } from 'edge-components'
import React, { Component } from 'react'
import { Switch } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { PasswordInput } from '../../modules/UI/components/Modals/components/PasswordInput.ui.js'
import { TextInput } from '../../modules/UI/components/Modals/components/TextInput.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import type { SpendingLimits as SpendingLimitsType } from '../../reducers/SpendingLimitsReducer.js'
import styles from '../../styles/scenes/SpendingLimitsStyle.js'

const ENTER_YOUR_PASSWORD = s.strings.enter_your_password
const TRANSACTION_SPENDING_LIMIT_TITLE = s.strings.spending_limits_tx_title
const TRANSACTION_SPENDING_LIMIT_PLACEHOLDER = s.strings.spending_limits_tx_title
const TRANSACTION_SPENDING_LIMIT_DESCRIPTION = s.strings.spending_limits_tx_description
const SAVE_TEXT = s.strings.save

export type SpendingLimitsOwnProps = {
  transactionSpendingLimit: {
    amount: number,
    isEnabled: boolean
  },
  currencySymbol: string,
  onSubmit: (SpendingLimitsType, password: string) => mixed
}
export type SpendingLimitsState = {
  password: string,
  transactionAmount: number,
  transactionIsEnabled: boolean
}
export class SpendingLimitsComponent extends Component<SpendingLimitsOwnProps, SpendingLimitsState> {
  constructor (props: SpendingLimitsOwnProps) {
    super(props)
    this.state = {
      password: '',
      transactionAmount: props.transactionSpendingLimit.amount,
      transactionIsEnabled: props.transactionSpendingLimit.isEnabled
    }
  }

  render () {
    const { currencySymbol } = this.props
    const { transactionAmount, transactionIsEnabled } = this.state
    const { onTransactionIsEnabledChanged, onTransactionAmountChanged, onPasswordChanged, onSubmit } = this

    return (
      <SafeAreaView style={{}}>
        <Gradient style={styles.gradient} />

        <Scene style={styles.scene}>
          <KeyboardAwareScrollView>
            <Scene.Header>
              <PasswordInput label={ENTER_YOUR_PASSWORD} onChangeText={onPasswordChanged} />
            </Scene.Header>

            <Scene.Padding style={styles.spacer} />

            <Scene.Body>
              <Scene.Row>
                <Scene.Item>
                  <Scene.Body.Text style={styles.bodyText}>{TRANSACTION_SPENDING_LIMIT_TITLE}</Scene.Body.Text>

                  <Scene.Body.Text style={styles.bodyText}>{TRANSACTION_SPENDING_LIMIT_DESCRIPTION}</Scene.Body.Text>
                </Scene.Item>

                <Switch onValueChange={onTransactionIsEnabledChanged} value={transactionIsEnabled} />
              </Scene.Row>

              <Scene.Row>
                <TextInput
                  disabled={!transactionIsEnabled}
                  value={transactionAmount.toString()}
                  onChangeText={onTransactionAmountChanged}
                  containerStyle={[{ flex: 1 }]}
                  label={TRANSACTION_SPENDING_LIMIT_PLACEHOLDER}
                  suffix={currencySymbol}
                  autoCorrect={false}
                  keyboardType={'numeric'}
                />
              </Scene.Row>
            </Scene.Body>

            <Scene.Padding style={styles.spacer} />

            <Scene.Footer>
              <PrimaryButton onPress={onSubmit}>
                <PrimaryButton.Text>{SAVE_TEXT}</PrimaryButton.Text>
              </PrimaryButton>
            </Scene.Footer>
          </KeyboardAwareScrollView>
        </Scene>
      </SafeAreaView>
    )
  }

  onTransactionIsEnabledChanged = (transactionIsEnabled: boolean) => {
    this.setState({ transactionIsEnabled })
  }

  onTransactionAmountChanged = (transactionAmount: string) => {
    this.setState({ transactionAmount: parseFloat(transactionAmount) || 0 })
  }

  onPasswordChanged = (password: string) => {
    this.setState({ password })
  }

  onSubmit = () => {
    const { password, transactionIsEnabled, transactionAmount } = this.state
    const { onSubmit } = this.props

    onSubmit(
      {
        transaction: {
          isEnabled: transactionIsEnabled,
          amount: parseFloat(transactionAmount)
        }
      },
      password
    )
  }
}
