// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { connect } from 'react-redux'

import { showError, showToast } from '../../../components/services/AirshipInstance'
import type { Theme, ThemeProps } from '../../../components/services/ThemeContext'
import { cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings'
import type { RootState } from '../../../reducers/RootReducer'
import { truncateDecimals } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import T from '../../UI/components/FormattedText/FormattedText.ui'
import { Slider } from '../../UI/components/Slider/Slider.ui'

const DIVIDE_PRECISION = 18

type OwnProps = {
  successMessage?: string,
  onSubmit?: number => Promise<any>,
  onSuccess?: () => void,
  goTo?: (params: any) => void,
  getOperationFee: EdgeCurrencyWallet => Promise<number>,
  fioWallet: EdgeCurrencyWallet
}

export type State = {
  showSlider: boolean,
  loading: boolean,
  error: string,
  feeLoading: boolean,
  fee: number | null,
  displayFee: number,
  balance: number
}

export type StateProps = {
  denominationMultiplier: string
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
      balance: 0
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
    const { fioWallet, onSubmit, onSuccess, successMessage } = this.props
    const { fee } = this.state
    if (!fioWallet) {
      showError(s.strings.fio_wallet_missing_for_fio_domain)
      this.setState({ error: s.strings.fio_wallet_missing_for_fio_domain })
      return
    }

    if (fee === null) {
      showError(s.strings.fio_get_fee_err_msg)
      this.setState({ error: s.strings.fio_get_fee_err_msg })
      return
    }

    try {
      this.setState({ loading: true })
      if (onSubmit) await onSubmit(fee)

      if (onSuccess) onSuccess()
      showToast(successMessage || s.strings.string_done_cap)
    } catch (e) {
      showError(e.message)
    }
    this.setState({ loading: false })
  }

  setFee = async (): Promise<void> => {
    const { fioWallet, getOperationFee, goTo } = this.props
    let fee = null
    let displayFee = 0
    let showSlider = false
    if (fioWallet) {
      this.setState({ feeLoading: true })
      try {
        fee = await getOperationFee(fioWallet)
        if (fee) {
          if (goTo) {
            this.setState({ feeLoading: false })
            return goTo({ fee })
          }
          displayFee = this.formatFio(`${fee}`)
          showSlider = true
        }
      } catch (e) {
        showError(e.message)
        this.setState({ error: e.message })
      }
      this.setState({ fee, displayFee, showSlider, feeLoading: false })
    }
  }

  setBalance = async (): Promise<void> => {
    const { fioWallet } = this.props
    if (fioWallet) {
      const balance = await fioWallet.getBalance()
      this.setState({ balance: this.formatFio(balance) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_domain)
    }
  }

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  renderFeeAndBalance() {
    const { theme } = this.props
    const { feeLoading, displayFee, balance, error, showSlider } = this.state
    const styles = getStyles(theme)

    if (!feeLoading && error) {
      return (
        <View>
          <T style={styles.title}>{error}</T>
        </View>
      )
    }

    if (feeLoading || !showSlider) return null

    return (
      <View style={styles.texts}>
        <View style={styles.spacer} />
        <View style={styles.spacer} />
        <T style={styles.title}>{s.strings.fio_action_fee_label}</T>
        <T style={styles.content}>
          {displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
        </T>
        <View style={styles.spacer} />
        {displayFee ? (
          <View>
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
        ) : null}
      </View>
    )
  }

  render(): React$Node {
    const { theme } = this.props
    const { loading, feeLoading, showSlider, displayFee, balance } = this.state
    const styles = getStyles(theme)

    return (
      <View>
        {feeLoading && <ActivityIndicator style={styles.loader} size="small" />}
        {this.renderFeeAndBalance()}
        <View style={styles.spacer} />
        {showSlider && (
          <View style={styles.blockPadding}>
            <Slider
              forceUpdateGuiCounter={0}
              resetSlider={false}
              onSlidingComplete={this.onConfirm}
              sliderDisabled={displayFee > balance || loading}
              showSpinner={loading}
              disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
            />
          </View>
        )}
      </View>
    )
  }
}
const getStyles = cacheStyles((theme: Theme) => ({
  loader: {
    marginTop: theme.rem(3)
  },
  title: {
    color: theme.secondaryText,
    marginBottom: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceTitle: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    fontSize: theme.rem(1),
    color: theme.dangerText,
    fontWeight: 'normal',
    textAlign: 'center'
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

export const FioActionSubmit = connect((state: RootState): StateProps => {
  const displayDenomination = getDisplayDenomination(state, Constants.FIO_STR)
  return {
    denominationMultiplier: displayDenomination.multiplier
  }
})(withTheme(FioActionSubmitComponent))
