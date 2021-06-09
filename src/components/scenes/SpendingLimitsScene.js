// @flow

import { Gradient, Scene } from 'edge-components'
import * as React from 'react'
import { StyleSheet, Switch } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { TextField } from 'react-native-material-textfield'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type SpendingLimits as SpendingLimitsType } from '../../types/types.js'

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
export class SpendingLimitsComponent extends React.Component<SpendingLimitsOwnProps, SpendingLimitsState> {
  constructor(props: SpendingLimitsOwnProps) {
    super(props)
    this.state = {
      password: '',
      transactionAmount: props.transactionSpendingLimit.amount,
      transactionIsEnabled: props.transactionSpendingLimit.isEnabled
    }
  }

  render() {
    const { currencySymbol } = this.props
    const { transactionAmount, transactionIsEnabled } = this.state
    const { onTransactionIsEnabledChanged, onTransactionAmountChanged, onPasswordChanged, onSubmit } = this

    return (
      <SafeAreaView style={{}}>
        <Gradient style={styles.gradient} />

        <Scene key="SpendingLimitsSceneKey" style={styles.scene}>
          <KeyboardAwareScrollView>
            <Scene.Header>
              <TextField
                baseColor={THEME.COLORS.GRAY_2}
                tintColor={THEME.COLORS.GRAY_2}
                secureTextEntry
                label={s.strings.enter_your_password}
                onChangeText={onPasswordChanged}
              />
            </Scene.Header>

            <Scene.Padding style={styles.spacer} />

            <Scene.Body>
              <Scene.Row>
                <Scene.Item>
                  <Scene.Body.Text style={styles.bodyText}>{s.strings.spending_limits_tx_title}</Scene.Body.Text>

                  <Scene.Body.Text style={styles.bodyText}>{s.strings.spending_limits_tx_description}</Scene.Body.Text>
                </Scene.Item>

                <Switch onValueChange={onTransactionIsEnabledChanged} value={transactionIsEnabled} />
              </Scene.Row>

              <Scene.Row>
                <TextField
                  tintColor={THEME.COLORS.SECONDARY}
                  baseColor={THEME.COLORS.SECONDARY}
                  disabled={!transactionIsEnabled}
                  value={transactionAmount.toString()}
                  onChangeText={onTransactionAmountChanged}
                  containerStyle={[{ flex: 1 }]}
                  label={s.strings.spending_limits_tx_title}
                  suffix={currencySymbol}
                  autoCorrect={false}
                  keyboardType="numeric"
                />
              </Scene.Row>
            </Scene.Body>

            <Scene.Padding style={styles.spacer} />

            <Scene.Footer>
              <PrimaryButton onPress={onSubmit}>
                <PrimaryButton.Text>{s.strings.save}</PrimaryButton.Text>
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

const rawStyles = {
  scene: {
    padding: 24,
    backgroundColor: THEME.COLORS.WHITE
  },
  spacer: {
    height: 28
  },
  gradient: {
    height: THEME.HEADER
  },
  bodyText: {
    color: THEME.COLORS.PRIMARY,
    fontFamily: THEME.FONTS.DEFAULT
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
