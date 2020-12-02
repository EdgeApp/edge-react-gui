// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { getRenewalFee, renewFioName } from '../../modules/FioAddress/util'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes'
import type { FioAddress } from '../../types/types'
import { truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { PrimaryButton } from '../themed/ThemedButtons'
import { Tile } from '../themed/Tile'

const DIVIDE_PRECISION = 18

type LocalState = {
  showRenew: boolean,
  renewError: string,
  feeLoading: boolean,
  renewalFee: number | null,
  renewLoading: boolean,
  displayFee: number,
  balance: number
}

type StateProps = {
  fioAddresses: FioAddress[],
  denominationMultiplier: string,
  isConnected: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  expiration?: string,
  showRenew?: boolean,
  refreshAfterRenew?: boolean
}

type Props = NavigationProps & StateProps & DispatchProps & ThemeProps

class FioAddressSettingsComponent extends React.Component<Props, LocalState> {
  state: LocalState = {
    showRenew: false,
    renewError: '',
    feeLoading: false,
    renewalFee: null,
    renewLoading: false,
    displayFee: 0,
    balance: 0
  }

  componentDidMount(): * {
    const { showRenew, refreshAllFioAddresses } = this.props
    refreshAllFioAddresses()
    if (showRenew) {
      this.setBalance()
      this.setFee()
    }
  }

  setFee = async (): Promise<void> => {
    const { fioWallet } = this.props
    let renewalFee = null
    let displayFee = 0
    let showRenew = false
    if (fioWallet) {
      this.setState({ feeLoading: true })
      try {
        renewalFee = await getRenewalFee(fioWallet)
        if (renewalFee) {
          displayFee = this.formatFio(`${renewalFee}`)
          showRenew = true
        }
      } catch (e) {
        showError(e)
        this.setState({ renewError: e.message })
      }
      this.setState({ renewalFee, displayFee, showRenew, feeLoading: false })
    }
  }

  setBalance = async (): Promise<void> => {
    const { fioWallet } = this.props
    if (fioWallet) {
      const balance = await fioWallet.getBalance()
      this.setState({ balance: this.formatFio(balance) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  getExpiration = (): string => {
    const { fioAddresses, fioAddressName } = this.props
    const fioAddress = fioAddresses.find(({ name }) => fioAddressName === name)
    if (fioAddress) return formatDate(new Date(fioAddress.expiration))
    return ''
  }

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  onRenewPress = async () => {
    this.setBalance()
    this.setFee()
  }

  onConfirm = async () => {
    const { fioWallet, fioAddressName, isConnected, refreshAllFioAddresses, refreshAfterRenew } = this.props
    const { renewalFee } = this.state

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    if (!fioWallet) {
      showError(s.strings.fio_wallet_missing_for_fio_address)
      this.setState({ renewError: s.strings.fio_wallet_missing_for_fio_address })
      return
    }

    if (renewalFee === null) {
      showError(s.strings.fio_get_fee_err_msg)
      this.setState({ renewError: s.strings.fio_get_fee_err_msg })
      return
    }

    try {
      this.setState({ renewLoading: true })
      const { expiration } = await renewFioName(fioWallet, fioAddressName, renewalFee)

      refreshAllFioAddresses()

      this.setState({ showRenew: false })
      showToast(s.strings.fio_request_renew_ok_text)
      Actions.pop()
      if (refreshAfterRenew) {
        window.requestAnimationFrame(() => {
          Actions.refresh({ fioAddressName, expiration: formatDate(new Date(expiration)) })
        })
      }
    } catch (e) {
      showError(e)
      this.setState({ renewError: e.message })
    }
    this.setState({ renewLoading: false })
  }

  renderFeeAndBalance() {
    const { theme } = this.props
    const { feeLoading, displayFee, balance, renewError, showRenew } = this.state
    const styles = getStyles(theme)

    if (!feeLoading && renewError) {
      return <EdgeText style={styles.title}>{renewError}</EdgeText>
    }

    if (feeLoading || !showRenew) return null

    const balanceText = `${balance ? balance.toFixed(2) : '0'} ${balance ? s.strings.fio_address_confirm_screen_fio_label : ''}`
    return (
      <View style={styles.texts}>
        <EdgeText style={styles.title}>{s.strings.title_fio_renew_address}</EdgeText>
        <Tile
          type="static"
          title={s.strings.fio_renew_fee_label}
          body={displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
        />
        {displayFee ? (
          <Tile type="static" title={s.strings.fio_address_confirm_screen_balance_label}>
            <EdgeText style={displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle}>{balanceText}</EdgeText>
          </Tile>
        ) : null}
      </View>
    )
  }

  render() {
    const { fioAddressName, theme } = this.props
    let { expiration } = this.props
    const { feeLoading, displayFee, balance, renewalFee, renewLoading, showRenew } = this.state
    const styles = getStyles(theme)

    if (!expiration) {
      expiration = this.getExpiration()
    }

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddressName} />
        <Tile type="static" title={s.strings.fio_address_details_screen_expires} body={expiration} />
        {!showRenew && (
          <View style={styles.blockPadding}>
            <PrimaryButton onPress={this.onRenewPress} disabled={feeLoading} label={feeLoading ? '' : s.strings.title_fio_renew_address}>
              {feeLoading ? <ActivityIndicator color={theme.icon} size="large" /> : null}
            </PrimaryButton>
          </View>
        )}
        {this.renderFeeAndBalance()}
        {showRenew && renewalFee !== null && !feeLoading ? (
          <View style={styles.blockPadding}>
            <Scene.Footer>
              <Slider
                forceUpdateGuiCounter={0}
                resetSlider={false}
                onSlidingComplete={this.onConfirm}
                sliderDisabled={displayFee > balance || renewLoading}
                showSpinner={renewLoading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        ) : null}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  title: {
    color: theme.secondaryText,
    marginBottom: theme.rem(0.5),
    fontSize: theme.rem(1),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  texts: {
    paddingTop: theme.rem(1.5)
  },
  balanceTitle: {
    margin: theme.rem(0.25),
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  balanceTitleDisabled: {
    margin: theme.rem(0.25),
    fontSize: theme.rem(1),
    color: theme.dangerText,
    fontWeight: 'normal'
  },
  blockPadding: {
    paddingTop: theme.rem(2),
    paddingLeft: theme.rem(1.25),
    paddingRight: theme.rem(1.25)
  }
}))

const mapStateToProps = (state: RootState) => {
  const displayDenomination = getDisplayDenomination(state, FIO_STR)

  const out: StateProps = {
    fioAddresses: state.ui.scenes.fioAddress.fioAddresses,
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }

  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshAllFioAddresses: () => {
    dispatch(refreshAllFioAddresses())
  }
})

export const FioAddressSettingsScene = connect(mapStateToProps, mapDispatchToProps)(withTheme(FioAddressSettingsComponent))
