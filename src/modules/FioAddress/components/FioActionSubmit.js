// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { connect } from 'react-redux'

import { showError, showToast } from '../../../components/services/AirshipInstance'
import type { Theme, ThemeProps } from '../../../components/services/ThemeContext'
import { cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { Tile } from '../../../components/themed/Tile'
import { SecondaryButton } from '../../../components/themed/ThemedButtons'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings'
import type { RootState } from '../../../reducers/RootReducer'
import { truncateDecimals } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import { Slider } from '../../UI/components/Slider/Slider.ui'

const DIVIDE_PRECISION = 18

type OwnProps = {
  title?: string,
  successMessage?: string,
  onSubmit?: number => Promise<any>,
  onSuccess?: ({ expiration?: string }) => void,
  cancelOperation?: () => void,
  goTo?: (params: any) => void,
  getOperationFee: EdgeCurrencyWallet => Promise<number>,
  fioWallet: EdgeCurrencyWallet,
  addressTitles?: boolean
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
    const { fioWallet, onSubmit, onSuccess, successMessage, addressTitles } = this.props
    const { fee } = this.state
    if (!fioWallet) {
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
      let result: { expiration?: string } = {}
      if (onSubmit) {
        result = await onSubmit(fee)
      }

      if (onSuccess) onSuccess(result)
      showToast(successMessage || s.strings.string_done_cap)
    } catch (e) {
      showError(e)
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
        showError(e)
        this.setState({ error: e.message })
      }
      this.setState({ fee, displayFee, showSlider, feeLoading: false })
    }
  }

  setBalance = async (): Promise<void> => {
    const { fioWallet, addressTitles } = this.props
    if (fioWallet) {
      const balance = await fioWallet.getBalance()
      this.setState({ balance: this.formatFio(balance) })
    } else {
      showError(addressTitles ? s.strings.fio_wallet_missing_for_fio_address : s.strings.fio_wallet_missing_for_fio_domain)
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
    const { title, theme } = this.props
    const { loading, feeLoading, showSlider, displayFee, balance } = this.state
    const styles = getStyles(theme)

    return (
      <View>
        {feeLoading && <ActivityIndicator color={theme.iconTappable} style={styles.loader} size="small" />}
        <EdgeText style={styles.actionTitle}>{title || ''}</EdgeText>
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
        <View style={styles.spacer} />
        <View style={styles.blockPadding}>
          {!feeLoading && <SecondaryButton onPress={this.props.cancelOperation} disabled={loading || feeLoading} label={s.strings.string_cancel_cap} />}
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
    margin: theme.rem(0.25),
    color: theme.primaryText
  },
  balanceTitleDisabled: {
    margin: theme.rem(0.25),
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

export const FioActionSubmit = connect((state: RootState): StateProps => {
  const displayDenomination = getDisplayDenomination(state, Constants.FIO_STR)
  return {
    denominationMultiplier: displayDenomination.multiplier
  }
})(withTheme(FioActionSubmitComponent))
