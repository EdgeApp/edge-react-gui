// @flow

import { mul, toFixed } from 'biggystring'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgeDenomination, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { FIO_STR } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDomainRegInfo } from '../../modules/FioAddress/util'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type RootState } from '../../types/reduxTypes'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import type { GuiWallet } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { Tile } from '../themed/Tile'

type StateProps = {
  state: RootState,
  wallets: { [string]: GuiWallet },
  fioPlugin?: EdgeCurrencyConfig,
  fioWallets: EdgeCurrencyWallet[],
  fioDisplayDenomination: EdgeDenomination,
  isConnected: boolean
}

type OwnProps = {
  navigation: NavigationProp<'fioDomainRegisterSelectWallet'>,
  route: RouteProp<'fioDomainRegisterSelectWallet'>
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type LocalState = {
  loading: boolean,
  supportedCurrencies: { [currencyCode: string]: boolean },
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } },
  activationCost: number,
  feeValue: number,
  paymentWallet?: {
    id: string,
    currencyCode: string
  },
  errorMessage?: string
}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

class FioDomainRegisterSelectWallet extends React.PureComponent<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 800,
    feeValue: 0,
    supportedCurrencies: {},
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo()
  }

  getRegInfo = async () => {
    this.setState({ loading: true })
    const { fioPlugin, fioDisplayDenomination, route } = this.props
    const { fioDomain, selectedWallet } = route.params
    if (fioPlugin != null) {
      try {
        const { activationCost, feeValue, supportedCurrencies, paymentInfo } = await getDomainRegInfo(
          fioPlugin,
          fioDomain,
          selectedWallet,
          fioDisplayDenomination
        )
        this.setState({ activationCost, feeValue, supportedCurrencies, paymentInfo })
      } catch (e) {
        showError(e)
        this.setState({ errorMessage: e.message })
      }
    }

    this.setState({ loading: false })
  }

  onWalletPress = () => {
    const { activationCost, loading } = this.state

    if (!activationCost || activationCost === 0 || loading) return

    this.selectWallet()
  }

  selectWallet = async () => {
    const { supportedCurrencies } = this.state

    const allowedCurrencyCodes = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    const { walletId, currencyCode }: WalletListResult = await Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />
    ))
    if (walletId && currencyCode) {
      this.setState({ paymentWallet: { id: walletId, currencyCode } })
    }
  }

  onNextPress = (): void => {
    const { isConnected, state, navigation, route } = this.props
    const { fioDomain, selectedWallet } = route.params
    const { feeValue, paymentInfo: allPaymentInfo, paymentWallet } = this.state

    if (!paymentWallet || !paymentWallet.id) return

    const { id: walletId, currencyCode: paymentCurrencyCode } = paymentWallet
    if (isConnected) {
      if (paymentCurrencyCode === FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        if (paymentWallet == null) return
        navigation.navigate('fioDomainConfirm', {
          fioName: fioDomain,
          paymentWallet,
          fee: feeValue,
          ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
        })
      } else {
        this.props.onSelectWallet(walletId, paymentCurrencyCode)

        const wallet = state.core.account.currencyWallets[walletId]
        const exchangeDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, paymentCurrencyCode)
        let nativeAmount = mul(allPaymentInfo[paymentCurrencyCode].amount, exchangeDenomination.multiplier)
        nativeAmount = toFixed(nativeAmount, 0, 0)

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
                  buttons={{ ok: { label: s.strings.string_ok_cap } }}
                />
              ))
              navigation.navigate('walletList')
            }
          }
        }

        navigation.navigate('send', {
          guiMakeSpendInfo,
          selectedWalletId: walletId,
          selectedCurrencyCode: paymentCurrencyCode
        })
      }
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  render() {
    const { theme, wallets, route } = this.props
    const { fioDomain } = route.params
    const { activationCost, loading, paymentWallet, errorMessage } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(s.strings.fio_domain_wallet_selection_text, loading ? '-' : activationCost)
    const paymentWalletBody =
      paymentWallet && paymentWallet.id ? `${wallets[paymentWallet.id].name} (${wallets[paymentWallet.id].currencyCode})` : s.strings.choose_your_wallet

    return (
      <SceneWrapper background="theme" bodySplit={theme.rem(1.5)}>
        <ScrollView>
          <IonIcon name="ios-at" style={styles.iconIon} color={theme.primaryText} size={theme.rem(4)} />
          <EdgeText style={styles.instructionalText} numberOfLines={7}>
            {detailsText}
          </EdgeText>
          <Tile type="static" title={s.strings.fio_domain_label} body={fioDomain} />
          <Tile type="static" title={s.strings.create_wallet_account_amount_due} body={loading ? s.strings.loading : `${activationCost} ${FIO_STR}`} />
          <Tile
            type="touchable"
            title={s.strings.create_wallet_account_select_wallet}
            body={paymentWalletBody}
            onPress={this.onWalletPress}
            disabled={!activationCost || activationCost === 0}
          />
          {!loading && paymentWallet && paymentWallet.id && (
            <MainButton label={s.strings.string_next_capitalized} marginRem={1} onPress={this.onNextPress} type="secondary" />
          )}
          {errorMessage && (
            <EdgeText style={styles.errorMessage} numberOfLines={3}>
              {errorMessage}
            </EdgeText>
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  instructionalText: {
    paddingHorizontal: theme.rem(1.5),
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(0.5),
    fontSize: theme.rem(1),
    textAlign: 'center',
    color: theme.secondaryText
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
  },
  errorMessage: {
    color: theme.dangerText,
    textAlign: 'center',
    padding: theme.rem(1.5),
    fontSize: theme.rem(1)
  }
}))

export const FioDomainRegisterSelectWalletScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    state,
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio,
    fioDisplayDenomination: getDisplayDenomination(state, params.selectedWallet.currencyInfo.pluginId, FIO_STR),
    wallets: state.ui.wallets.byId,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { currencyCode, walletId }
      })
    }
  })
)(withTheme(FioDomainRegisterSelectWallet))
