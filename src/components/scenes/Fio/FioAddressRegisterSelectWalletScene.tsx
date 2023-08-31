import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors'
import { config } from '../../../theme/appConfig'
import { connect } from '../../../types/reactRedux'
import { RootState } from '../../../types/reduxTypes'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getRegInfo } from '../../../util/FioAddressUtils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { Tile } from '../../tiles/Tile'

interface StateProps {
  account: EdgeAccount
  state: RootState
  fioPlugin?: EdgeCurrencyConfig
  fioWallets: EdgeCurrencyWallet[]
  fioDisplayDenomination: EdgeDenomination
  isConnected: boolean
}

interface OwnProps extends EdgeSceneProps<'fioAddressRegisterSelectWallet'> {}

interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

interface LocalState {
  loading: boolean
  supportedCurrencies: { [currencyCode: string]: boolean }
  paymentInfo: { [currencyCode: string]: { amount: string; address: string } }
  activationCost: number
  feeValue: number
  paymentWallet?: {
    id: string
    currencyCode: string
  }
  errorMessage?: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class FioAddressRegisterSelectWallet extends React.Component<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 40,
    feeValue: 0,
    supportedCurrencies: {},
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo().catch(err => showError(err))
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
      } catch (e: any) {
        showError(e)
        this.setState({ errorMessage: e.message })
      }
    }

    this.setState({ loading: false })
  }

  onNextPress = async (): Promise<void> => {
    const { route } = this.props
    const { selectedDomain } = route.params
    const { activationCost } = this.state

    if (!activationCost || activationCost === 0) return

    if (selectedDomain.walletId) {
      await this.proceed(selectedDomain.walletId, FIO_STR)
    } else {
      const { paymentWallet } = this.state
      if (!paymentWallet || !paymentWallet.id) return
      await this.proceed(paymentWallet.id, paymentWallet.currencyCode)
    }
  }

  onWalletPress = async () => {
    const { activationCost } = this.state
    if (!activationCost || activationCost === 0) return

    await this.selectWallet()
  }

  selectWallet = async () => {
    const { supportedCurrencies } = this.state

    const allowedCurrencyCodes: string[] = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    const { walletId, currencyCode } = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={this.props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={[{ pluginId: 'fio' }]} />
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
            name: lstrings.fio_address_register_metadata_name,
            notes: `${lstrings.title_fio_address_confirmation}\n${fioAddress}`
          },
          dismissAlert: true,
          lockInputs: true,
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error) {
              setTimeout(() => {
                showError(lstrings.create_wallet_account_error_sending_transaction)
              }, 750)
            } else if (edgeTransaction) {
              Alert.alert(
                `${lstrings.fio_address_register_form_field_label} ${lstrings.fragment_wallet_unconfirmed}`,
                sprintf(lstrings.fio_address_register_pending, lstrings.fio_address_register_form_field_label),
                [{ text: lstrings.string_ok_cap }]
              )
              navigation.navigate('walletsTab', { screen: 'walletList' })
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
      showError(lstrings.fio_network_alert_text)
    }
  }

  renderSelectWallet = () => {
    const { account, theme, route } = this.props
    const { selectedDomain, fioAddress } = route.params
    const { activationCost, paymentWallet, loading } = this.state

    const nextDisabled = !activationCost || activationCost === 0 || (!selectedDomain.walletId && (!paymentWallet || !paymentWallet.id))
    const costStr = loading ? lstrings.loading : `${activationCost} ${FIO_STR}`
    const walletName = !paymentWallet || !paymentWallet.id ? lstrings.choose_your_wallet : getWalletName(account.currencyWallets[paymentWallet.id])

    return (
      <>
        <Tile type="static" title={lstrings.fio_address_register_form_field_label} body={fioAddress} />
        {!selectedDomain.walletId && (
          <Tile type="touchable" title={lstrings.create_wallet_account_select_wallet} body={walletName} onPress={this.onWalletPress} />
        )}
        <Tile type="static" title={lstrings.create_wallet_account_amount_due} body={costStr} />
        {!loading && ((paymentWallet && paymentWallet.id) || selectedDomain.walletId !== '') && (
          <MainButton disabled={nextDisabled} onPress={this.onNextPress} label={lstrings.string_next_capitalized} marginRem={1} type="secondary" />
        )}
        {loading && <ActivityIndicator color={theme.iconTappable} />}
      </>
    )
  }

  render() {
    const { theme } = this.props
    const { errorMessage } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(lstrings.fio_address_payment_required_text, config.appName)
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
    account: state.core.account,
    state,
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio,
    fioDisplayDenomination: getDisplayDenomination(state, params.selectedWallet.currencyInfo.pluginId, FIO_STR),
    defaultFiatCode: state.ui.settings.defaultIsoFiat,
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
