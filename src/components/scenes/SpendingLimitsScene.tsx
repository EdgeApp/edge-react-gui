import * as React from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { setSpendingLimits } from '../../actions/SpendingLimitsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { SpendingLimits } from '../../types/types'
import { zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText } from '../legacy/FormattedText/FormattedText.ui'
import { showError } from '../services/AirshipInstance'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface OwnProps extends EdgeSceneProps<'spendingLimits'> {}

interface StateProps {
  transactionSpendingLimit: {
    amount: number
    isEnabled: boolean
  }
  currencySymbol: string
}
interface DispatchProps {
  onSubmit: (navigation: NavigationBase, spendingLimits: SpendingLimits, password: string) => Promise<void>
}
type Props = OwnProps & StateProps & DispatchProps

interface State {
  password: string
  transactionAmount: string
  transactionIsEnabled: boolean
}

class SpendingLimitsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      password: '',
      transactionAmount: !zeroString(props.transactionSpendingLimit.amount.toString()) ? props.transactionSpendingLimit.amount.toString() : '',
      transactionIsEnabled: props.transactionSpendingLimit.isEnabled
    }
  }

  render() {
    const { currencySymbol } = this.props
    const { transactionAmount, transactionIsEnabled, password } = this.state

    return (
      <SceneWrapper background="legacy" hasHeader>
        <KeyboardAwareScrollView contentContainerStyle={styles.scene}>
          <OutlinedTextInput secureTextEntry autoFocus label={lstrings.enter_your_password} value={password} onChangeText={this.onPasswordChanged} />

          <View style={styles.switchRow}>
            <View style={styles.textBlock}>
              <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_title}</FormattedText>
              <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_description}</FormattedText>
            </View>
            <Switch onValueChange={this.onTransactionIsEnabledChanged} value={transactionIsEnabled} accessibilityHint={lstrings.toggle_button_hint} />
          </View>

          <OutlinedTextInput
            disabled={!transactionIsEnabled}
            value={transactionAmount}
            onChangeText={this.onTransactionAmountChanged}
            label={lstrings.spending_limits_tx_title}
            autoCorrect={false}
            autoFocus={false}
            keyboardType="numeric"
            prefix={currencySymbol}
          />

          <View style={styles.spacer} />

          <PrimaryButton onPress={this.onSubmit}>
            <PrimaryButton.Text>{lstrings.save}</PrimaryButton.Text>
          </PrimaryButton>
        </KeyboardAwareScrollView>
      </SceneWrapper>
    )
  }

  onTransactionIsEnabledChanged = (transactionIsEnabled: boolean) => {
    this.setState({ transactionIsEnabled })
  }

  onTransactionAmountChanged = (transactionAmount: string) => {
    this.setState({ transactionAmount })
  }

  onPasswordChanged = (password: string) => {
    this.setState({ password })
  }

  onSubmit = () => {
    const { password, transactionIsEnabled, transactionAmount } = this.state
    const { navigation, onSubmit } = this.props

    onSubmit(
      navigation,
      {
        transaction: {
          isEnabled: transactionIsEnabled,
          amount: parseFloat(transactionAmount)
        }
      },
      password
    ).catch(err => showError(err))
  }
}

const styles = StyleSheet.create({
  scene: {
    alignItems: 'stretch',
    padding: 24
  },
  spacer: {
    height: 28
  },
  switchRow: {
    flexDirection: 'row',
    paddingVertical: 28
  },
  textBlock: {
    flex: 1
  },
  bodyText: {
    color: THEME.COLORS.PRIMARY,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 14
  }
})

export const SpendingLimitsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    currencySymbol: getSymbolFromCurrency(state.ui.settings.defaultFiat),
    transactionSpendingLimit: state.ui.settings.spendingLimits.transaction
  }),
  dispatch => ({
    async onSubmit(navigation: NavigationBase, spendingLimits: SpendingLimits, password: string) {
      await dispatch(setSpendingLimits(navigation, spendingLimits, password))
    }
  })
)(SpendingLimitsComponent)
