import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors'
import { config } from '../../../theme/appConfig'
import { connect } from '../../../types/reactRedux'
import { RootState } from '../../../types/reduxTypes'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { GuiMakeSpendInfo } from '../../../types/types'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getDomainRegInfo } from '../../../util/FioAddressUtils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ButtonsModal } from '../../modals/ButtonsModal'
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

interface OwnProps extends EdgeSceneProps<'fioDomainRegisterSelectWallet'> {}

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
    this.getRegInfo().catch(err => showError(err))
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
      } catch (e: any) {
        showError(e)
        this.setState({ errorMessage: e.message })
      }
    }

    this.setState({ loading: false })
  }

  onWalletPress = async () => {
    const { activationCost, loading } = this.state

    if (!activationCost || activationCost === 0 || loading) return

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

        const guiMakeSpendInfo: GuiMakeSpendInfo = {
          currencyCode: paymentCurrencyCode,
          nativeAmount,
          publicAddress: allPaymentInfo[paymentCurrencyCode].address,
          metadata: {
            name: lstrings.fio_address_register_metadata_name,
            notes: `${lstrings.title_register_fio_domain}\n${fioDomain}`
          },
          dismissAlert: true,
          lockInputs: true,
          onDone: (error, edgeTransaction) => {
            if (error) {
              setTimeout(() => {
                showError(lstrings.create_wallet_account_error_sending_transaction)
              }, 750)
            } else if (edgeTransaction) {
              Airship.show<'ok' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title={`${lstrings.fio_domain_label} ${lstrings.fragment_wallet_unconfirmed}`}
                  message={sprintf(lstrings.fio_address_register_pending, lstrings.fio_domain_label)}
                  buttons={{ ok: { label: lstrings.string_ok_cap } }}
                />
              )).catch(err => showError(err))
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

  render() {
    const { account, theme, route } = this.props
    const { fioDomain } = route.params
    const { activationCost, loading, paymentWallet, errorMessage } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(lstrings.fio_domain_wallet_selection_text, config.appName, loading ? '-' : activationCost)

    let paymentWalletBody = lstrings.choose_your_wallet
    if (paymentWallet != null && paymentWallet.id !== '') {
      const wallet = account.currencyWallets[paymentWallet.id]
      paymentWalletBody = `${getWalletName(wallet)} (${wallet.currencyInfo.currencyCode})`
    }

    return (
      <SceneWrapper background="theme" bodySplit={theme.rem(1.5)}>
        <ScrollView>
          <IonIcon name="ios-at" style={styles.iconIon} color={theme.primaryText} size={theme.rem(4)} />
          <EdgeText style={styles.instructionalText} numberOfLines={7}>
            {detailsText}
          </EdgeText>
          <Tile type="static" title={lstrings.fio_domain_label} body={fioDomain} />
          <Tile type="static" title={lstrings.create_wallet_account_amount_due} body={loading ? lstrings.loading : `${activationCost} ${FIO_STR}`} />
          <Tile
            type="touchable"
            title={lstrings.create_wallet_account_select_wallet}
            body={paymentWalletBody}
            onPress={this.onWalletPress}
            // @ts-expect-error
            disabled={!activationCost || activationCost === 0}
          />
          {!loading && paymentWallet && paymentWallet.id && (
            <MainButton label={lstrings.string_next_capitalized} marginRem={1} onPress={this.onNextPress} type="secondary" />
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
    account: state.core.account,
    state,
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio,
    fioDisplayDenomination: getDisplayDenomination(state, params.selectedWallet.currencyInfo.pluginId, FIO_STR),
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
