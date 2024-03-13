import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { selectDisplayDenomByCurrencyCode } from '../../../selectors/DenominationSelectors'
import { config } from '../../../theme/appConfig'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { EdgeAsset } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getDomainRegInfo } from '../../../util/FioAddressUtils'
import { logEvent, TrackingEventName, TrackingValues } from '../../../util/tracking'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { AlertCardUi4 } from '../../ui4/AlertCardUi4'
import { CardUi4 } from '../../ui4/CardUi4'
import { RowUi4 } from '../../ui4/RowUi4'
import { SendScene2Params } from '../SendScene2'

interface StateProps {
  account: EdgeAccount
  fioPlugin?: EdgeCurrencyConfig
  fioWallets: EdgeCurrencyWallet[]
  fioDisplayDenomination: EdgeDenomination
  isConnected: boolean
}

interface OwnProps extends EdgeSceneProps<'fioDomainRegisterSelectWallet'> {}

interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string) => void
  onLogEvent: (event: TrackingEventName, values: TrackingValues) => void
}

interface LocalState {
  loading: boolean
  supportedAssets: EdgeAsset[]
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
    supportedAssets: [],
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
        const { activationCost, feeValue, supportedAssets, supportedCurrencies, paymentInfo } = await getDomainRegInfo(
          fioPlugin,
          fioDomain,
          selectedWallet,
          fioDisplayDenomination
        )
        this.setState({ activationCost, feeValue, supportedAssets, supportedCurrencies, paymentInfo })
      } catch (e: any) {
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
    const { supportedAssets } = this.state

    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this.props.navigation}
        headerTitle={lstrings.select_wallet}
        allowedAssets={[...supportedAssets, { pluginId: 'fio', tokenId: null }]}
      />
    ))
    if (result?.type === 'wallet') {
      const { walletId, currencyCode } = result
      this.setState({ paymentWallet: { id: walletId, currencyCode } })
    }
  }

  onNextPress = (): void => {
    const { account, isConnected, navigation, route, onLogEvent } = this.props
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

        const wallet = account.currencyWallets[walletId]
        const { amount: exchangeAmount, address: paymentAddress } = allPaymentInfo[paymentCurrencyCode]

        const cryptoAmount = new CryptoAmount({
          exchangeAmount,
          currencyCode: paymentCurrencyCode,
          currencyConfig: wallet.currencyConfig
        })

        const { tokenId, nativeAmount } = cryptoAmount

        const sendParams: SendScene2Params = {
          walletId,
          tokenId,
          dismissAlert: true,
          lockTilesMap: {
            address: true,
            amount: true,
            wallet: true
          },
          spendInfo: {
            tokenId,
            spendTargets: [
              {
                nativeAmount,
                publicAddress: paymentAddress
              }
            ],
            metadata: {
              name: lstrings.fio_address_register_metadata_name,
              notes: `${lstrings.title_register_fio_domain}\n${fioDomain}`
            }
          },
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
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
              onLogEvent('Fio_Domain_Register', {
                conversionValues: {
                  conversionType: 'crypto',
                  cryptoAmount
                }
              })
              navigation.navigate('homeTab', { screen: 'home' })
            }
          }
        }
        navigation.navigate('send2', sendParams)
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
      <SceneWrapper scroll>
        <View style={styles.container}>
          <IonIcon name="ios-at" style={styles.iconIon} color={theme.primaryText} size={theme.rem(4)} />
          <EdgeText style={styles.instructionalText} numberOfLines={7}>
            {detailsText}
          </EdgeText>
          <CardUi4>
            <RowUi4 title={lstrings.fio_domain_label} body={fioDomain} />
          </CardUi4>
          <CardUi4>
            <RowUi4 title={lstrings.create_wallet_account_amount_due} body={loading ? lstrings.loading : `${activationCost} ${FIO_STR}`} />
          </CardUi4>
          <CardUi4>
            <RowUi4
              rightButtonType="touchable"
              title={lstrings.create_wallet_account_select_wallet}
              body={paymentWalletBody}
              onPress={this.onWalletPress}
              // @ts-expect-error
              disabled={!activationCost || activationCost === 0}
            />
          </CardUi4>
          {!loading && paymentWallet && paymentWallet.id && (
            <MainButton label={lstrings.string_next_capitalized} marginRem={[2, 0, 2]} onPress={this.onNextPress} type="primary" />
          )}
          {errorMessage != null && <AlertCardUi4 title={lstrings.error_unexpected_title} body={errorMessage} type="error" />}
        </View>
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
  container: {
    marginHorizontal: theme.rem(0.5),
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
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio,
    fioDisplayDenomination: selectDisplayDenomByCurrencyCode(state, params.selectedWallet.currencyConfig, FIO_STR),
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { currencyCode, walletId }
      })
    },
    onLogEvent(event: TrackingEventName, values: TrackingValues) {
      dispatch(logEvent(event, values))
    }
  })
)(withTheme(FioDomainRegisterSelectWallet))
