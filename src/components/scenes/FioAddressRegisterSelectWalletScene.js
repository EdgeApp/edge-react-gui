// @flow

import { mul, toFixed } from 'biggystring'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgeDenomination, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { FIO_STR } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getRegInfo } from '../../modules/FioAddress/util'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type RootState } from '../../types/reduxTypes'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import type { GuiWallet } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
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
  navigation: NavigationProp<'fioAddressRegisterSelectWallet'>,
  route: RouteProp<'fioAddressRegisterSelectWallet'>
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

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class FioAddressRegisterSelectWallet extends React.Component<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 40,
    feeValue: 0,
    supportedCurrencies: {},
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo()
  }

  getRegInfo = async () => {
    this.setState({ loading: true })
    const { fioDisplayDenomination, route } = this.props
    const { fioAddress, selectedWallet, selectedDomain, isFallback } = route.params
    if (this.props.fioPlugin) {
      try {
        const { activationCost, feeValue, supportedCurrencies, paymentInfo } = await getRegInfo(
          this.props.fioPlugin,
          fioAddress,
          selectedWallet,
          selectedDomain,
          fioDisplayDenomination,
          isFallback
        )
        this.setState({ activationCost, feeValue, supportedCurrencies, paymentInfo })
      } catch (e) {
        showError(e)
        this.setState({ errorMessage: e.message })
      }
    }

    this.setState({ loading: false })
  }

  onNextPress = (): void => {
    const { route } = this.props
    const { selectedDomain } = route.params
    const { activationCost } = this.state

    if (!activationCost || activationCost === 0) return

    if (selectedDomain.walletId) {
      this.proceed(selectedDomain.walletId, FIO_STR)
    } else {
      const { paymentWallet } = this.state
      if (!paymentWallet || !paymentWallet.id) return
      this.proceed(paymentWallet.id, paymentWallet.currencyCode)
    }
  }

  onWalletPress = () => {
    const { activationCost } = this.state
    if (!activationCost || activationCost === 0) return

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

  proceed = async (walletId: string, paymentCurrencyCode: string) => {
    const { isConnected, state, navigation, route } = this.props
    const { selectedWallet, fioAddress } = route.params
    const { feeValue, paymentInfo: allPaymentInfo } = this.state

    if (isConnected) {
      if (paymentCurrencyCode === FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        if (paymentWallet == null) return
        navigation.navigate('fioNameConfirm', {
          fioName: fioAddress,
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
            notes: `${s.strings.title_fio_address_confirmation}\n${fioAddress}`
          },
          dismissAlert: true,
          lockInputs: true,
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error) {
              setTimeout(() => {
                showError(s.strings.create_wallet_account_error_sending_transaction)
              }, 750)
            } else if (edgeTransaction) {
              Alert.alert(
                `${s.strings.fio_address_register_form_field_label} ${s.strings.fragment_wallet_unconfirmed}`,
                sprintf(s.strings.fio_address_register_pending, s.strings.fio_address_register_form_field_label),
                [{ text: s.strings.string_ok_cap }]
              )
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

  renderSelectWallet = () => {
    const { wallets, theme, route } = this.props
    const { selectedDomain, fioAddress } = route.params
    const { activationCost, paymentWallet, loading } = this.state

    const nextDisabled = !activationCost || activationCost === 0 || (!selectedDomain.walletId && (!paymentWallet || !paymentWallet.id))
    const costStr = loading ? s.strings.loading : `${activationCost} ${FIO_STR}`
    const walletName = !paymentWallet || !paymentWallet.id ? s.strings.choose_your_wallet : wallets[paymentWallet.id].name

    return (
      <>
        <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddress} />
        {!selectedDomain.walletId && (
          <Tile type="touchable" title={s.strings.create_wallet_account_select_wallet} body={walletName} onPress={this.onWalletPress} />
        )}
        <Tile type="static" title={s.strings.create_wallet_account_amount_due} body={costStr} />
        {!loading && ((paymentWallet && paymentWallet.id) || selectedDomain.walletId !== '') && (
          <MainButton disabled={nextDisabled} onPress={this.onNextPress} label={s.strings.string_next_capitalized} marginRem={1} type="secondary" />
        )}
        {loading && <ActivityIndicator color={theme.iconTappable} />}
      </>
    )
  }

  render() {
    const { theme } = this.props
    const { activationCost, errorMessage, loading } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(s.strings.fio_address_wallet_selection_text, loading ? '-' : activationCost)
    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <View style={styles.header}>
            <Image source={theme.fioAddressLogo} style={styles.image} resizeMode="cover" />
            <EdgeText style={styles.instructionalText} numberOfLines={10}>
              {detailsText}
            </EdgeText>
          </View>
          {this.renderSelectWallet()}
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
  header: {
    paddingHorizontal: theme.rem(1.25)
  },
  instructionalText: {
    paddingVertical: theme.rem(1.5),
    fontSize: theme.rem(1),
    textAlign: 'center',
    color: theme.secondaryText
  },
  text: {
    color: theme.primaryText
  },
  errorMessage: {
    margin: theme.rem(1),
    textAlign: 'center',
    color: theme.dangerText
  },
  image: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    height: theme.rem(3.25),
    width: theme.rem(3.5)
  },
  bottomSpace: {
    paddingBottom: theme.rem(15)
  }
}))

export const FioAddressRegisterSelectWalletScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    state,
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio,
    fioDisplayDenomination: getDisplayDenomination(state, params.selectedWallet.currencyInfo.pluginId, FIO_STR),
    defaultFiatCode: state.ui.settings.defaultIsoFiat,
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
)(withTheme(FioAddressRegisterSelectWallet))
