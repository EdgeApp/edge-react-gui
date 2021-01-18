// @flow

import { bns } from 'biggystring'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgeDenomination, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { getDomainRegInfo } from '../../modules/FioAddress/util'
import { getExchangeDenomination } from '../../modules/Settings/selectors'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { getFioWallets } from '../../modules/UI/selectors'
import { type Dispatch, type RootState } from '../../types/reduxTypes'
import type { GuiWallet } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type StateProps = {
  state: RootState,
  wallets: { [string]: GuiWallet },
  fioPlugin: EdgeCurrencyConfig,
  fioWallets: EdgeCurrencyWallet[],
  fioDisplayDenomination: EdgeDenomination,
  defaultFiatCode: string,
  isConnected: boolean
}

type NavigationProps = {
  fioDomain: string,
  selectedWallet: EdgeCurrencyWallet
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type LocalState = {
  loading: boolean,
  supportedCurrencies: { [currencyCode: string]: boolean },
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } },
  activationCost: number
}

type Props = NavigationProps & StateProps & DispatchProps & ThemeProps

class FioDomainRegisterSelectWallet extends React.PureComponent<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 800,
    supportedCurrencies: {},
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo()
  }

  getRegInfo = async () => {
    this.setState({ loading: true })

    try {
      const { activationCost, supportedCurrencies, paymentInfo } = await getDomainRegInfo(
        this.props.fioPlugin,
        this.props.fioDomain,
        this.props.selectedWallet,
        this.props.fioDisplayDenomination
      )
      this.setState({ activationCost, supportedCurrencies, paymentInfo })
    } catch (e) {
      showError(e)
    }

    this.setState({ loading: false })
  }

  onPressNext = async () => {
    const { supportedCurrencies } = this.state

    const allowedCurrencyCodes = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          this.onSelectWallet(walletId, currencyCode)
        }
      }
    )
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { isConnected, selectedWallet, fioDomain, state } = this.props
    const { activationCost, paymentInfo: allPaymentInfo } = this.state

    if (isConnected) {
      if (paymentCurrencyCode === Constants.FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        Actions[Constants.FIO_DOMAIN_CONFIRM]({
          fioName: fioDomain,
          paymentWallet,
          fee: activationCost,
          ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
        })
      } else {
        this.props.onSelectWallet(walletId, paymentCurrencyCode)

        const exchangeDenomination = getExchangeDenomination(state, paymentCurrencyCode)
        let nativeAmount = bns.mul(allPaymentInfo[paymentCurrencyCode].amount, exchangeDenomination.multiplier)
        nativeAmount = bns.toFixed(nativeAmount, 0, 0)

        const guiMakeSpendInfo = {
          currencyCode: paymentCurrencyCode,
          nativeAmount,
          publicAddress: allPaymentInfo[paymentCurrencyCode].address,
          metadata: {
            name: s.strings.fio_address_register_metadata_name,
            notes: `${s.strings.title_register_fio_domain}\n${fioDomain}`
          },
          dismissAlert: true,
          lockInputs: true,
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error) {
              setTimeout(() => {
                showError(s.strings.create_wallet_account_error_sending_transaction)
              }, 750)
            } else if (edgeTransaction) {
              Airship.show(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title={`${s.strings.fio_domain_label} ${s.strings.fragment_wallet_unconfirmed}`}
                  message={sprintf(s.strings.fio_address_register_pending, s.strings.fio_domain_label)}
                  buttons={{
                    ok: { label: s.strings.string_ok_cap }
                  }}
                />
              ))
              Actions[Constants.WALLET_LIST]()
            }
          }
        }

        Actions[Constants.SEND_CONFIRMATION]({ guiMakeSpendInfo })
      }
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  renderSelectWallet = () => {
    const { theme } = this.props
    const { activationCost, loading } = this.state
    const styles = getStyles(theme)
    const isSelectWalletDisabled = !activationCost || activationCost === 0

    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={this.onPressNext}>
            {isSelectWalletDisabled || loading ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <PrimaryButton.Text style={styles.nextText}>{s.strings.create_wallet_account_select_wallet}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
        <View style={styles.paymentArea}>
          <T style={styles.paymentLeft}>{s.strings.create_wallet_account_amount_due}</T>
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <T style={styles.paymentRight}>
              {activationCost} {Constants.FIO_STR}
            </T>
          )}
        </View>
      </View>
    )
  }

  render() {
    const { theme } = this.props
    const { activationCost, loading } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(s.strings.fio_domain_wallet_selection_text, loading ? '-' : activationCost)
    return (
      <SceneWrapper background="header" bodySplit={theme.rem(1.5)}>
        <ScrollView>
          <View style={styles.scrollableView}>
            <IonIcon name="ios-at" style={styles.iconIon} color={theme.primaryText} size={theme.rem(4)} />
            <View style={styles.createWalletPromptArea}>
              <T style={styles.instructionalText}>{detailsText}</T>
            </View>
            {this.renderSelectWallet()}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
  },
  createWalletPromptArea: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(0.5)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    textAlign: 'center',
    color: theme.primaryText
  },
  buttons: {
    marginTop: theme.rem(1.5),
    flexDirection: 'row'
  },
  next: {
    marginLeft: theme.rem(1),
    flex: 1,
    backgroundColor: theme.primaryButton
  },
  nextText: {
    color: theme.primaryButtonText
  },
  selectPaymentLower: {
    backgroundColor: theme.backgroundGradientLeft,
    width: '100%',
    marginVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(1)
  },
  paymentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.rem(0.75),
    flex: 1
  },
  paymentLeft: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  paymentRight: {
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  bottomSpace: {
    paddingBottom: theme.rem(30)
  },
  iconIon: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    height: theme.rem(4),
    width: theme.rem(4),
    textAlign: 'center'
  }
}))

const FioDomainRegisterSelectWalletScene = connect(
  (state: RootState) => {
    const wallets = state.ui.wallets.byId
    const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
    const { account } = state.core
    const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]
    const fioDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, Constants.FIO_STR)

    const defaultFiatCode = SETTINGS_SELECTORS.getDefaultIsoFiat(state)

    const out: StateProps = {
      state,
      fioWallets,
      fioPlugin,
      fioDisplayDenomination,
      defaultFiatCode,
      wallets,
      isConnected: state.network.isConnected
    }
    return out
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSelectWallet: (walletId: string, currencyCode: string) => {
      dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
    }
  })
)(withTheme(FioDomainRegisterSelectWallet))
export { FioDomainRegisterSelectWalletScene }
