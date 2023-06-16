import * as React from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { TextField } from 'react-native-material-textfield'

import { setSpendingLimits } from '../../actions/SpendingLimitsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { SpendingLimits } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText } from '../legacy/FormattedText/FormattedText.ui'

interface OwnProps extends EdgeSceneProps<'spendingLimits'> {}

interface StateProps {
  transactionSpendingLimit: {
    amount: number
    isEnabled: boolean
  }
  currencySymbol: string
}
interface DispatchProps {
  onSubmit: (navigation: NavigationBase, spendingLimits: SpendingLimits, password: string) => unknown
}
type Props = OwnProps & StateProps & DispatchProps

interface State {
  password: string
  transactionAmount: number
  transactionIsEnabled: boolean
}

class SpendingLimitsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
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

    return (
      <SceneWrapper background="legacy" hasHeader>
        <KeyboardAwareScrollView contentContainerStyle={styles.scene}>
          <TextField
            baseColor={THEME.COLORS.GRAY_2}
            tintColor={THEME.COLORS.GRAY_2}
            secureTextEntry
            label={lstrings.enter_your_password}
            onChangeText={this.onPasswordChanged}
          />

          <View style={styles.switchRow}>
            <View style={styles.textBlock}>
              <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_title}</FormattedText>
              <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_description}</FormattedText>
            </View>
            <Switch onValueChange={this.onTransactionIsEnabledChanged} value={transactionIsEnabled} accessibilityHint={lstrings.toggle_button_hint} />
          </View>

          <TextField
            tintColor={THEME.COLORS.SECONDARY}
            baseColor={THEME.COLORS.SECONDARY}
            disabled={!transactionIsEnabled}
            value={transactionAmount.toString()}
            onChangeText={this.onTransactionAmountChanged}
            containerStyle={[{ flex: 1 }]}
            label={lstrings.spending_limits_tx_title}
            suffix={currencySymbol}
            autoCorrect={false}
            keyboardType="numeric"
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
    this.setState({ transactionAmount: parseFloat(transactionAmount) || 0 })
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
          // @ts-expect-error
          amount: parseFloat(transactionAmount)
        }
      },
      password
    )
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
    onSubmit(navigation: NavigationBase, spendingLimits: SpendingLimits, password: string) {
      dispatch(setSpendingLimits(navigation, spendingLimits, password))
    }
  })
)(SpendingLimitsComponent)
