// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { type RootState } from '../../types/reduxTypes'
import { getFeeDisplayed, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

export type LocalState = {
  balance: number | null,
  sliderDisabled: boolean | false,
  loading: boolean | false
}

export type StateProps = {
  fioPlugin: EdgeCurrencyConfig | null,
  denominationMultiplier: string,
  isConnected: boolean
}

export type NavigationProps = {
  fioName: string,
  paymentWallet: EdgeCurrencyWallet,
  fee: number,
  ownerPublicKey: string
}

type Props = NavigationProps & StateProps & ThemeProps

const ONE_FREE_ADDRESS_PER_DOMAIN_ERROR = 'ONE_FREE_ADDRESS_PER_DOMAIN_ERROR'

class FioNameConfirm extends React.PureComponent<Props, LocalState> {
  state: LocalState = {
    balance: null,
    sliderDisabled: false,
    loading: false
  }

  componentDidMount() {
    this.setBalance()
  }

  isFioAddress = () => {
    const { fioName } = this.props
    return fioName.indexOf(Constants.FIO_ADDRESS_DELIMITER) > -1
  }

  toggleButton = () => {
    const { fee } = this.props
    const { balance } = this.state
    if (balance !== null) {
      if (fee > balance) {
        this.setState({
          sliderDisabled: true
        })
      }
    }
  }

  setBalance = async () => {
    const { paymentWallet } = this.props
    try {
      const balance = await paymentWallet.getBalance()

      if (balance != null) {
        const newBalance = parseFloat(truncateDecimals(bns.div(balance, this.props.denominationMultiplier, 18), 6))
        this.setState({
          balance: newBalance
        })
      }

      this.toggleButton()
    } catch (e) {
      this.setState({
        balance: 0
      })
    }
  }

  saveFioName = async () => {
    const { isConnected, fioName, paymentWallet, fioPlugin, ownerPublicKey, fee } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    this.setState({ loading: true })

    if (!fee) {
      if (this.isFioAddress()) {
        try {
          if (!fioPlugin) {
            throw new Error(s.strings.fio_register_address_err_msg)
          }
          const response = await fioPlugin.otherMethods.buyAddressRequest(
            {
              address: fioName,
              referralCode: fioPlugin.currencyInfo.defaultSettings.defaultRef,
              publicKey: ownerPublicKey
            },
            true
          )
          if (response.error) {
            if (response.errorCode && response.errorCode === ONE_FREE_ADDRESS_PER_DOMAIN_ERROR && response.code === 400) {
              const publicDomains = await fioPlugin.otherMethods.getDomains(fioPlugin.currencyInfo.defaultSettings.fallbackRef)
              const domainExists = publicDomains.find(domain => domain.domain === fioName.split(Constants.FIO_ADDRESS_DELIMITER)[1])
              if (domainExists && !domainExists.free) {
                await Airship.show(bridge => (
                  <ButtonsModal
                    bridge={bridge}
                    title={s.strings.fio_address_register_pay_title}
                    message={s.strings.fio_address_register_pay}
                    buttons={{
                      ok: { label: s.strings.string_ok_cap }
                    }}
                  />
                ))
                return Actions[Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET]({
                  fioAddress: fioName,
                  selectedWallet: paymentWallet,
                  selectedDomain: {
                    name: domainExists.domain,
                    expiration: new Date().toDateString(),
                    isPublic: true,
                    walletId: '',
                    isFree: domainExists.free
                  },
                  isFallback: true
                })
              }
            }
            throw new Error(response.error)
          }

          await Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={`${s.strings.fio_address_register_form_field_label} ${s.strings.fragment_wallet_unconfirmed}`}
              message={s.strings.fio_address_register_pending_free}
              buttons={{
                ok: { label: s.strings.string_ok_cap }
              }}
            />
          ))
          Actions[Constants.WALLET_LIST]()
        } catch (e) {
          showError(e)
        }
      } else {
        showError(s.strings.fio_get_fee_err_msg)
      }
    } else {
      try {
        if (this.isFioAddress()) {
          const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioAddress', { fioAddress: fioName, ownerPublicKey })
          window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ fioName, expiration, feeCollected }))
        } else {
          const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioDomain', {
            fio_domain: fioName,
            max_fee: fee,
            owner_fio_public_key: ownerPublicKey
          })
          window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ fioName, expiration, feeCollected }))
        }
      } catch (e) {
        showError(s.strings.fio_register_address_err_msg)
      }
    }
    this.setState({ loading: false })
  }

  render() {
    const { fioName, fee, theme } = this.props
    const { balance, loading } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <View style={styles.scene}>
          <View style={styles.info}>
            <T style={styles.title}>{this.isFioAddress() ? s.strings.fio_address_confirm_screen_label : s.strings.fio_domain_label}</T>
            <T style={styles.titleLarge}>{this.isFioAddress() ? fioName : `${Constants.FIO_ADDRESS_DELIMITER}${fioName}`}</T>
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_registration_label}</T>
            <T style={styles.title}>
              {fee ? getFeeDisplayed(fee) : s.strings.fio_domain_free} {balance && fee ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
            <View style={styles.spacer} />
            {fee ? (
              <View>
                <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
                <T style={balance && fee <= balance ? styles.title : styles.titleDisabled}>
                  {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
                </T>
              </View>
            ) : null}
          </View>
          <View style={styles.blockPadding}>
            <Scene.Footer>
              <Slider
                resetSlider={false}
                onSlidingComplete={this.saveFioName}
                sliderDisabled={(!balance && !!fee) || (balance !== null && fee > balance) || loading}
                showSpinner={loading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  info: {
    paddingTop: theme.rem(2),
    paddingLeft: theme.rem(0.5),
    paddingRight: theme.rem(0.5)
  },
  title: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleDisabled: {
    color: theme.negativeText,
    fontSize: theme.rem(1),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleLarge: {
    color: theme.primaryText,
    fontSize: theme.rem(1.5),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  blockPadding: {
    paddingTop: theme.rem(4),
    paddingLeft: theme.rem(1.25),
    paddingRight: theme.rem(1.25)
  },
  spacer: {
    paddingTop: theme.rem(1.25)
  }
}))

const FioNameConfirmScene = connect((state: RootState) => {
  const { account } = state.core
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  const displayDenomination = getDisplayDenomination(state, Constants.FIO_STR)

  const out: StateProps = {
    fioPlugin,
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }
  return out
}, {})(withTheme(FioNameConfirm))
export { FioNameConfirmScene }
