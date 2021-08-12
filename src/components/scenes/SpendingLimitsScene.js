// @flow

import * as React from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { TextField } from 'react-native-material-textfield'

import { setSpendingLimits } from '../../actions/SpendingLimitsActions.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { DEFAULT_PLUGIN_SPENDING_LIMITS } from '../../reducers/SpendingLimitsReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { type SpendingLimits } from '../../types/types.js'
import { getFiatSymbol } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type OwnProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  currencyCode: string,
  // eslint-disable-next-line react/no-unused-prop-types
  fiatCurrencyCode: string
}

type StateProps = {
  transactionSpendingLimit: {
    amount: number,
    isEnabled: boolean
  },
  fiatCurrencySymbol: string
}
type DispatchProps = {
  onSubmit: (spendingLimits: SpendingLimits, password: string, currencyCode?: string, fiatCurrencyCode?: string) => mixed
}
type Props = StateProps & DispatchProps & OwnProps

type State = {
  password: string,
  transactionAmount: number,
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
    const { fiatCurrencySymbol } = this.props
    const { transactionAmount, transactionIsEnabled } = this.state
    const { onTransactionIsEnabledChanged, onTransactionAmountChanged, onPasswordChanged, onSubmit } = this

    return (
      <SceneWrapper background="body" hasHeader>
        <KeyboardAwareScrollView contentContainerStyle={styles.scene}>
          <TextField
            baseColor={THEME.COLORS.GRAY_2}
            tintColor={THEME.COLORS.GRAY_2}
            secureTextEntry
            label={s.strings.enter_your_password}
            onChangeText={onPasswordChanged}
          />

          <View style={styles.switchRow}>
            <View style={styles.textBlock}>
              <FormattedText style={styles.bodyText}>{s.strings.spending_limits_tx_title}</FormattedText>
              <FormattedText style={styles.bodyText}>{s.strings.spending_limits_tx_description}</FormattedText>
            </View>
            <Switch onValueChange={onTransactionIsEnabledChanged} value={transactionIsEnabled} />
          </View>

          <TextField
            tintColor={THEME.COLORS.SECONDARY}
            baseColor={THEME.COLORS.SECONDARY}
            disabled={!transactionIsEnabled}
            value={transactionAmount.toString()}
            onChangeText={onTransactionAmountChanged}
            containerStyle={[{ flex: 1 }]}
            label={s.strings.spending_limits_tx_title}
            suffix={fiatCurrencySymbol}
            autoCorrect={false}
            keyboardType="numeric"
          />

          <View style={styles.spacer} />

          <PrimaryButton onPress={onSubmit}>
            <PrimaryButton.Text>{s.strings.save}</PrimaryButton.Text>
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
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const SpendingLimitsScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    let fiatCurrencyCode = state.ui.settings.defaultFiat
    let transactionSpendingLimit = state.ui.settings.spendingLimits.transaction

    if (ownProps.fiatCurrencyCode && ownProps.currencyCode) {
      fiatCurrencyCode = ownProps.fiatCurrencyCode
      transactionSpendingLimit = (state.ui.settings.spendingLimits.pluginLimits[ownProps.currencyCode] ?? DEFAULT_PLUGIN_SPENDING_LIMITS).transaction
    }

    return {
      fiatCurrencySymbol: getFiatSymbol(fiatCurrencyCode),
      transactionSpendingLimit
    }
  },
  (dispatch, ownProps) => ({
    onSubmit(spendingLimits: SpendingLimits, password: string) {
      dispatch(setSpendingLimits(spendingLimits, password, ownProps.currencyCode, ownProps.fiatCurrencyCode))
    }
  })
)(SpendingLimitsComponent)
