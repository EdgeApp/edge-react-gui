// @flow

import { div } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import type { WalletListResult } from '../../../components/modals/WalletListModal'
import { WalletListModal } from '../../../components/modals/WalletListModal'
import { Airship, showError, showToast } from '../../../components/services/AirshipInstance'
import type { Theme, ThemeProps } from '../../../components/services/ThemeContext'
import { cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton.js'
import { Tile } from '../../../components/themed/Tile'
import { FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import s from '../../../locales/strings'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { connect } from '../../../types/reactRedux.js'
import { getAvailableBalance } from '../../../util/CurrencyWalletHelpers.js'
import { DECIMAL_PRECISION, truncateDecimals } from '../../../util/utils'
import { Slider } from '../../UI/components/Slider/Slider'

type ActionResult =
  | {
      expiration: string
    }
  | {
      bundledTxs: number
    }
  | any
type OwnProps = {
  title?: string,
  successMessage?: string,
  onSubmit?: (wallet: EdgeCurrencyWallet, fee: number) => Promise<any>,
  onSuccess?: (attrs: ActionResult) => void,
  cancelOperation?: () => void,
  goTo?: (params: any) => void,
  getOperationFee: EdgeCurrencyWallet => Promise<number>,
  fioWallet: EdgeCurrencyWallet,
  addressTitles?: boolean,
  showPaymentWalletPicker?: boolean
}

type State = {
  showSlider: boolean,
  loading: boolean,
  error: string,
  feeLoading: boolean,
  fee: number | null,
  displayFee: number,
  balance: number,
  paymentWallet?: EdgeCurrencyWallet
}

type StateProps = {
  denominationMultiplier: string,
  currencyWallets: { [string]: EdgeCurrencyWallet },
  fioWallets: EdgeCurrencyWallet[]
}

type Props = OwnProps & ThemeProps & StateProps

class FioActionSubmitComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      showSlider: false,
      loading: false,
      error: '',
      feeLoading: false,
      fee: null,
      displayFee: 0,
      balance: 0,
      paymentWallet: props.fioWallet
    }
  }

  componentDidMount(): void {
    this.setBalance()
    this.setFee()
  }

  resetSlider = () => {
    this.setState({ showSlider: false }, () => this.setState({ showSlider: true }))
  }

  onConfirm = async () => {
    const { onSubmit, onSuccess, successMessage, addressTitles } = this.props
    const { paymentWallet, fee } = this.state
    if (!paymentWallet) {
      const msg = addressTitles ? s.strings.fio_wallet_missing_for_fio_address : s.strings.fio_wallet_missing_for_fio_domain
      showError(msg)
      this.setState({ error: msg })
      return
    }

    if (fee === null) {
      showError(s.strings.fio_get_fee_err_msg)
      this.setState({ error: s.strings.fio_get_fee_err_msg })
      return
    }

    try {
      this.setState({ loading: true })
      let result: ActionResult = {}
      if (onSubmit) {
        result = await onSubmit(paymentWallet, fee)
      }

      this.setState({ loading: false })
      if (onSuccess) onSuccess(result)
      if (successMessage) showToast(successMessage)
    } catch (e) {
      this.setState({ loading: false })
      showError(e)
    }
  }

  handleWalletPress = () => {
    const { fioWallet } = this.props
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={[fioWallet.currencyInfo.currencyCode]} />
    ))
      .then(({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          this.props.currencyWallets[walletId] &&
            this.setState({ paymentWallet: this.props.currencyWallets[walletId] }, () => {
              this.setBalance()
              this.setFee()
            })
        }
      })
      .catch(error => console.log(error))
  }

  setFee = async (): Promise<void> => {
    const { getOperationFee, goTo } = this.props
    const { paymentWallet } = this.state
    let fee = null
    let displayFee = 0
    let showSlider = false
    if (paymentWallet) {
      this.setState({ feeLoading: true })
      try {
        fee = await getOperationFee(paymentWallet)
        if (fee) {
          if (goTo) {
            this.setState({ feeLoading: false })
            return goTo({ fee })
          }
          displayFee = this.formatFio(`${fee}`)
          showSlider = true
        }
      } catch (e) {
        showError(e)
        this.setState({ error: e.message })
      }
      this.setState({ fee, displayFee, showSlider, feeLoading: false })
    }
  }

  setBalance = (): void => {
    const { addressTitles } = this.props
    const { paymentWallet } = this.state
    if (paymentWallet) {
      const availbleBalance = getAvailableBalance(paymentWallet)
      this.setState({ balance: this.formatFio(availbleBalance) })
    } else {
      showError(addressTitles ? s.strings.fio_wallet_missing_for_fio_address : s.strings.fio_wallet_missing_for_fio_domain)
    }
  }

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(div(val, this.props.denominationMultiplier, DECIMAL_PRECISION)))
  }

  renderFeeAndBalance() {
    const { theme } = this.props
    const { feeLoading, displayFee, balance, error, showSlider } = this.state
    const styles = getStyles(theme)

    if (!feeLoading && error) {
      return <EdgeText style={styles.errorMessage}>{error}</EdgeText>
    }

    if (feeLoading || !showSlider) return null

    const balanceText = `${balance ? balance.toFixed(2) : '0'} ${balance ? s.strings.fio_address_confirm_screen_fio_label : ''}`
    return (
      <>
        <Tile
          type="static"
          title={s.strings.fio_action_fee_label}
          body={displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
        />
        {displayFee ? (
          <Tile type="static" title={s.strings.fio_address_confirm_screen_balance_label}>
            <EdgeText style={displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle}>{balanceText}</EdgeText>
          </Tile>
        ) : null}
      </>
    )
  }

  render(): React$Node {
    const { title, showPaymentWalletPicker, fioWallets, theme } = this.props
    const { loading, feeLoading, showSlider, displayFee, paymentWallet, balance } = this.state
    const styles = getStyles(theme)

    return (
      <View>
        {feeLoading && <ActivityIndicator color={theme.iconTappable} style={styles.loader} size="small" />}
        {title ? <EdgeText style={styles.actionTitle}>{title}</EdgeText> : null}
        {showPaymentWalletPicker && fioWallets.length > 1 ? (
          <Tile
            type="editable"
            title={s.strings.select_wallet}
            onPress={this.handleWalletPress}
            body={paymentWallet && paymentWallet.name ? paymentWallet.name : ''}
          />
        ) : null}
        {this.renderFeeAndBalance()}
        <View style={styles.spacer} />
        {showSlider && (
          <View style={styles.blockPadding}>
            <Slider
              onSlidingComplete={this.onConfirm}
              disabled={displayFee > balance || loading}
              showSpinner={loading}
              disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
            />
          </View>
        )}
        <View style={styles.spacer} />
        <View style={styles.blockPadding}>
          {!feeLoading && (
            <MainButton disabled={loading || feeLoading} label={s.strings.string_cancel_cap} type="secondary" onPress={this.props.cancelOperation} />
          )}
        </View>
      </View>
    )
  }
}
const getStyles = cacheStyles((theme: Theme) => ({
  loader: {
    marginTop: theme.rem(3)
  },
  actionTitle: {
    marginTop: theme.rem(1.5),
    marginBottom: theme.rem(1),
    textAlign: 'center'
  },
  balanceTitle: {
    color: theme.primaryText
  },
  balanceTitleDisabled: {
    color: theme.dangerText
  },
  errorMessage: {
    color: theme.dangerText
  },
  blockPadding: {
    paddingTop: theme.rem(0.5),
    paddingLeft: theme.rem(1.25),
    paddingRight: theme.rem(1.25)
  },
  spacer: {
    paddingTop: theme.rem(1.25)
  }
}))

export const FioActionSubmit = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => ({
    denominationMultiplier: getDisplayDenomination(state, ownProps.fioWallet.currencyInfo.pluginId, FIO_STR).multiplier,
    currencyWallets: state.core.account.currencyWallets,
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({})
)(withTheme(FioActionSubmitComponent))
