import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination, EdgeTokenId, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { launchPaymentProto } from '../../../actions/PaymentProtoActions'
import { FIO_PLUGIN_ID, FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { selectDisplayDenom } from '../../../selectors/DenominationSelectors'
import { config } from '../../../theme/appConfig'
import { connect } from '../../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../../types/routerTypes'
import { EdgeAsset, FioDomain } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getRegInfo, PaymentInfo } from '../../../util/FioAddressUtils'
import { logEvent, TrackingEventName, TrackingValues } from '../../../util/tracking'
import { EdgeButton } from '../../buttons/EdgeButton'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showDevError, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

export interface FioAddressRegisterSelectWalletParams {
  fioAddress: string
  selectedDomain: FioDomain
  walletId: string
  isFallback?: boolean
}

interface StateProps {
  account: EdgeAccount
  fioPlugin?: EdgeCurrencyConfig
  fioWallets: EdgeCurrencyWallet[]
  fioDisplayDenomination: EdgeDenomination
  isConnected: boolean
}

interface OwnProps extends EdgeAppSceneProps<'fioAddressRegisterSelectWallet'> {
  wallet: EdgeCurrencyWallet
}

interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string) => void
  onLogEvent: (event: TrackingEventName, values: TrackingValues) => void
}

interface LocalState {
  loading: boolean
  supportedAssets: EdgeAsset[]
  paymentInfo: PaymentInfo
  activationCost: number
  bitpayUrl: string
  feeValue: number
  paymentWallet?: {
    id: string
    tokenId: EdgeTokenId
  }
  errorMessage?: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class FioAddressRegisterSelectWallet extends React.Component<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 40,
    bitpayUrl: '',
    feeValue: 0,
    supportedAssets: [],
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo().catch(err => showError(err))
  }

  getRegInfo = async () => {
    this.setState({ loading: true })
    const { fioDisplayDenomination, route, wallet: selectedWallet } = this.props
    const { fioAddress, selectedDomain, isFallback } = route.params
    if (this.props.fioPlugin) {
      try {
        const { activationCost, bitpayUrl, feeValue, supportedAssets, paymentInfo } = await getRegInfo(
          this.props.fioPlugin,
          fioAddress,
          selectedWallet,
          selectedDomain,
          fioDisplayDenomination,
          isFallback
        )
        this.setState({ activationCost, bitpayUrl, feeValue, supportedAssets: [...supportedAssets, { pluginId: 'fio', tokenId: null }], paymentInfo })
      } catch (e: any) {
        showDevError(String(e))
        this.setState({ errorMessage: String(e) })
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
      await this.proceed(selectedDomain.walletId, null)
    } else {
      const { paymentWallet } = this.state
      if (!paymentWallet || !paymentWallet.id) return
      await this.proceed(paymentWallet.id, paymentWallet.tokenId)
    }
  }

  onWalletPress = async () => {
    const { activationCost } = this.state
    if (!activationCost || activationCost === 0) return

    await this.selectWallet()
  }

  selectWallet = async () => {
    const { supportedAssets } = this.state

    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this.props.navigation as NavigationBase}
        headerTitle={lstrings.select_wallet}
        allowedAssets={supportedAssets}
      />
    ))
    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result
      this.setState({ paymentWallet: { id: walletId, tokenId } })
    }
  }

  proceed = async (walletId: string, tokenId: EdgeTokenId) => {
    const { account, isConnected, navigation, route, wallet: selectedWallet, onLogEvent } = this.props
    const { fioAddress } = route.params
    const { bitpayUrl, feeValue, paymentInfo: allPaymentInfo } = this.state
    const wallet = account.currencyWallets[walletId]
    const { pluginId } = wallet.currencyInfo

    if (isConnected) {
      if (pluginId === FIO_PLUGIN_ID) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        if (paymentWallet == null) return
        navigation.navigate('fioNameConfirm', {
          fioName: fioAddress,
          walletId: paymentWallet.id,
          fee: feeValue,
          ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
        })
      } else {
        const paymentCurrencyCode = getCurrencyCode(wallet, tokenId)
        this.props.onSelectWallet(walletId, paymentCurrencyCode)

        const { amount: exchangeAmount } = allPaymentInfo[pluginId][tokenId ?? '']

        const cryptoAmount = new CryptoAmount({
          exchangeAmount,
          tokenId,
          currencyConfig: wallet.currencyConfig
        })

        await launchPaymentProto(this.props.navigation as NavigationBase, this.props.account, bitpayUrl, {
          wallet: wallet,
          metadata: {
            name: lstrings.fio_address_register_metadata_name,
            notes: `${lstrings.title_fio_address_confirmation}\n${fioAddress}`
          },
          onDone: (edgeTransaction?: EdgeTransaction) => {
            if (edgeTransaction != null) {
              Airship.show<'ok' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title={`${lstrings.fio_address_register_form_field_label} ${lstrings.fragment_wallet_unconfirmed}`}
                  message={sprintf(lstrings.fio_address_register_pending, lstrings.fio_address_register_form_field_label)}
                  buttons={{
                    ok: { label: lstrings.string_ok_cap }
                  }}
                />
              )).catch(() => {})

              onLogEvent('Fio_Handle_Register', {
                conversionValues: {
                  conversionType: 'crypto',
                  cryptoAmount
                }
              })
              navigation.navigate('edgeTabs', { screen: 'home' })
            }
          }
        })
      }
    } else {
      showError(lstrings.fio_network_alert_text)
    }
  }

  renderSelectWallet = () => {
    const { account, route } = this.props
    const { selectedDomain, fioAddress } = route.params
    const { activationCost, paymentWallet, loading } = this.state

    const nextDisabled = !activationCost || activationCost === 0 || (!selectedDomain.walletId && (!paymentWallet || !paymentWallet.id))
    const costStr = loading ? lstrings.loading : `${activationCost} ${FIO_STR}`
    const walletName = !paymentWallet || !paymentWallet.id ? lstrings.choose_your_wallet : getWalletName(account.currencyWallets[paymentWallet.id])

    return (
      <>
        <EdgeCard sections marginRem={[0.5, 0.5, 2, 0.5]}>
          <EdgeRow title={lstrings.fio_address_register_form_field_label} body={fioAddress} />
          {!selectedDomain.walletId && (
            <EdgeRow rightButtonType="touchable" title={lstrings.create_wallet_account_select_wallet} body={walletName} onPress={this.onWalletPress} />
          )}
          <EdgeRow title={lstrings.create_wallet_account_amount_due} body={costStr} loading={loading} />
        </EdgeCard>
        <EdgeButton disabled={nextDisabled} onPress={this.onNextPress} label={lstrings.string_next_capitalized} type="primary" />
      </>
    )
  }

  render() {
    const { theme } = this.props
    const { errorMessage } = this.state
    const styles = getStyles(theme)
    const detailsText = sprintf(lstrings.fio_address_payment_required_text, config.appName)
    return (
      <SceneWrapper scroll padding={theme.rem(0.5)}>
        <Image source={theme.fioAddressLogo} style={styles.image} resizeMode="cover" />
        <EdgeText style={styles.instructionalText} numberOfLines={10}>
          {detailsText}
        </EdgeText>
        {this.renderSelectWallet()}
        {errorMessage && (
          <EdgeText style={styles.errorMessage} numberOfLines={3}>
            {errorMessage}
          </EdgeText>
        )}
        <View style={styles.bottomSpace} />
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  instructionalText: {
    paddingVertical: theme.rem(1.5),
    paddingHorizontal: theme.rem(0.5),
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

const FioAddressRegisterSelectWalletConnected = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { wallet } = ownProps
    return {
      account: state.core.account,
      fioWallets: state.ui.wallets.fioWallets,
      fioPlugin: state.core.account.currencyConfig.fio,
      fioDisplayDenomination: selectDisplayDenom(state, wallet.currencyConfig, null),
      defaultFiatCode: state.ui.settings.defaultIsoFiat,
      isConnected: state.network.isConnected
    }
  },
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
)(withTheme(FioAddressRegisterSelectWallet))

export const FioAddressRegisterSelectWalletScene = withWallet(FioAddressRegisterSelectWalletConnected)
