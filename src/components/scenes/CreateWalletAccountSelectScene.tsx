import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { sprintf } from 'sprintf-js'

import {
  createAccountTransaction,
  createCurrencyWallet,
  fetchAccountActivationInfo,
  fetchWalletAccountActivationPaymentInfo
} from '../../actions/CreateWalletActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { NavigationBase, RouteProp } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { scale } from '../../util/scaling'
import { logEvent } from '../../util/tracking'
import { fixFiatCurrencyCode } from '../../util/utils'
import { Airship } from '../services/AirshipInstance'

export interface AccountPaymentParams {
  requestedAccountName: string
  currencyCode: string
  ownerPublicKey: string
  activePublicKey: string
  requestedAccountCurrencyCode: string
}

interface OwnProps {
  route: RouteProp<'createWalletAccountSelect'>
  navigation: NavigationBase
}

interface StateProps {
  account: EdgeAccount
  paymentCurrencyCode: string
  amount: string
  supportedCurrencies: { [currencyCode: string]: boolean }
  activationCost: string
  paymentDenominationSymbol: string
  existingCoreWallet?: EdgeCurrencyWallet
  walletAccountActivationQuoteError: string
}

interface DispatchProps {
  createAccountBasedWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => Promise<EdgeCurrencyWallet>
  fetchAccountActivationInfo: (walletType: string) => void
  createAccountTransaction: (navigation: NavigationBase, createdWalletId: string, accountName: string, paymentWalletId: string) => void
  fetchWalletAccountActivationPaymentInfo: (paymentInfo: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) => void
  setWalletAccountActivationQuoteError: (message: string) => void
}

type Props = OwnProps & DispatchProps & StateProps

interface State {
  isCreatingWallet: boolean
  walletId: string
  error: string
  createdWallet: Promise<EdgeCurrencyWallet>
}

export class CreateWalletAccountSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { createAccountBasedWallet, route } = this.props
    const { selectedFiat, selectedWalletType, accountName } = route.params
    let createdWallet: Promise<EdgeCurrencyWallet>
    if (props.existingCoreWallet != null) {
      createdWallet = this.renameAndReturnWallet(props.existingCoreWallet)
    } else {
      createdWallet = createAccountBasedWallet(accountName, selectedWalletType.walletType, fixFiatCurrencyCode(selectedFiat.value)).then(wallet => {
        this.setState({ isCreatingWallet: false })
        return wallet
      })
    }
    this.state = {
      isCreatingWallet: true,
      error: '',
      walletId: '',
      createdWallet
    }
    props.fetchAccountActivationInfo(selectedWalletType.walletType)
  }

  renameAndReturnWallet = async (wallet: EdgeCurrencyWallet) => {
    const { route } = this.props
    const { accountName } = route.params
    await wallet.renameWallet(accountName)
    this.setState({ isCreatingWallet: false })
    return wallet
  }

  componentDidMount() {
    logEvent('Activate_Wallet_Select')
  }

  onPressSelect = () => {
    const { supportedCurrencies } = this.props
    const allowedCurrencyCodes: string[] = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={this.props.navigation} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  onPressSubmit = async () => {
    const { createAccountTransaction, route, navigation } = this.props
    const { accountName } = route.params
    const { walletId } = this.state
    const createdWallet = await this.state.createdWallet
    const createdWalletId = createdWallet.id
    // will grab data from state in actions
    createAccountTransaction(navigation, createdWalletId, accountName, walletId)
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { fetchWalletAccountActivationPaymentInfo, setWalletAccountActivationQuoteError, route } = this.props
    const { accountName, selectedWalletType } = route.params
    setWalletAccountActivationQuoteError('') // reset fetching quote error to falsy
    this.setState({ walletId })
    const createdWallet = await this.state.createdWallet
    const paymentInfo: AccountPaymentParams = {
      requestedAccountName: accountName,
      currencyCode: paymentCurrencyCode,
      ownerPublicKey: createdWallet.publicWalletInfo.keys.ownerPublicKey,
      activePublicKey: createdWallet.publicWalletInfo.keys.publicKey,
      requestedAccountCurrencyCode: selectedWalletType.currencyCode
    }

    fetchWalletAccountActivationPaymentInfo(paymentInfo, createdWallet)
  }

  renderSelectWallet = () => {
    const { activationCost, route } = this.props
    const { selectedWalletType } = route.params
    const currencyCode = selectedWalletType.currencyCode
    const isSelectWalletDisabled = !activationCost || activationCost === ''
    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={this.onPressSelect}>
            {isSelectWalletDisabled ? (
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
            ) : (
              <PrimaryButton.Text>{s.strings.create_wallet_account_select_wallet}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
        <View style={styles.paymentArea}>
          <Text style={styles.paymentLeft}>{s.strings.create_wallet_account_amount_due}</Text>
          <Text style={styles.paymentRight}>
            {activationCost} {currencyCode}
          </Text>
        </View>
      </View>
    )
  }

  renderPaymentReview = () => {
    const { account, paymentCurrencyCode, amount, activationCost, paymentDenominationSymbol, route } = this.props
    const { walletId, createdWallet, isCreatingWallet } = this.state
    const { accountName, selectedWalletType, selectedFiat } = route.params

    const wallet = account.currencyWallets[walletId]
    if (!wallet) return null
    const name = getWalletName(wallet)

    // @ts-expect-error
    const isContinueButtonDisabled = isCreatingWallet || (createdWallet && !amount)

    return (
      <View>
        <View style={styles.selectPaymentLower}>
          <View style={styles.accountReviewWalletNameArea}>
            <Text style={styles.accountReviewWalletNameText}>
              {name}:{paymentCurrencyCode}
            </Text>
          </View>
          <View style={styles.paymentAndIconArea}>
            <View style={styles.paymentLeftIconWrap}>
              <CryptoIcon pluginId={wallet.currencyInfo.pluginId} sizeRem={1.5} />
            </View>
            <View style={styles.paymentArea}>
              <Text style={styles.paymentLeft}>
                {paymentDenominationSymbol} {amount} {paymentCurrencyCode}
              </Text>
              <Text style={styles.paymentRight}>
                {activationCost} {selectedWalletType.currencyCode}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.accountReviewInfoArea}>
          <Text style={styles.accountReviewInfoText}>
            {s.strings.create_wallet_crypto_type_label} {selectedWalletType.currencyCode}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {s.strings.create_wallet_fiat_type_label} {selectedFiat.label}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {s.strings.create_wallet_name_label} {accountName}
          </Text>
        </View>
        <View style={styles.accountReviewConfirmArea}>
          <Text style={styles.accountReviewConfirmText}>{s.strings.create_wallet_account_confirm}</Text>
        </View>
        <View style={styles.confirmButtonArea}>
          <PrimaryButton disabled={isContinueButtonDisabled} style={styles.confirmButton} onPress={this.onPressSubmit}>
            {/* we want it disabled with activity indicator if creating wallet, or wallet is created and pending quote */}
            {isContinueButtonDisabled ? (
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
            ) : (
              <PrimaryButton.Text>{s.strings.legacy_address_modal_continue}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
      </View>
    )
  }

  render() {
    const { route, activationCost, walletAccountActivationQuoteError } = this.props
    const { selectedWalletType } = route.params
    const { walletId } = this.state

    const instructionSyntax = sprintf(
      s.strings.create_wallet_account_select_instructions_with_cost,
      selectedWalletType.currencyCode,
      selectedWalletType.currencyCode,
      config.appNameShort,
      `${activationCost} ${selectedWalletType.currencyCode}`
    )
    const confirmMessageSyntax = sprintf(s.strings.create_wallet_account_make_payment, selectedWalletType.currencyCode)

    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.scrollableGradient} />
          <ScrollView>
            <View style={styles.scrollableView}>
              <CryptoIcon currencyCode={selectedWalletType.currencyCode} marginRem={[1.5, 0, 0, 0]} sizeRem={4} />

              <View style={styles.createWalletPromptArea}>
                <Text style={styles.instructionalText}>{!walletId || walletAccountActivationQuoteError ? instructionSyntax : confirmMessageSyntax}</Text>
              </View>
              {!walletId || walletAccountActivationQuoteError ? this.renderSelectWallet() : this.renderPaymentReview()}
            </View>
            <View style={{ paddingBottom: 200 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  scrollableGradient: {
    height: THEME.HEADER
  },
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
  },
  createWalletPromptArea: {
    paddingTop: scale(16),
    paddingBottom: scale(8)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },
  selectPaymentLower: {
    backgroundColor: THEME.COLORS.GRAY_4,
    width: '100%',
    marginVertical: scale(8),
    paddingHorizontal: scale(16)
  },
  paymentAndIconArea: {
    flexDirection: 'row'
  },
  paymentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    flex: 1
  },
  paymentLeft: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  paymentLeftIconWrap: {
    paddingVertical: scale(12),
    marginRight: 6
  },

  paymentRight: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  accountReviewWalletNameArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: scale(14),
    paddingBottom: scale(8),
    alignItems: 'center'
  },
  accountReviewWalletNameText: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(16),
    color: THEME.COLORS.SECONDARY
  },
  accountReviewInfoArea: {
    width: '100%',
    marginVertical: scale(10),
    paddingHorizontal: scale(10)
  },
  accountReviewInfoText: {
    color: THEME.COLORS.GRAY_2
  },
  accountReviewConfirmArea: {
    width: '100%',
    marginTop: scale(12),
    marginBottom: scale(12),
    paddingHorizontal: scale(10)
  },
  accountReviewConfirmText: {
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  confirmButtonArea: {
    marginHorizontal: scale(30)
  },
  confirmButton: {}
})

export const CreateWalletAccountSelectScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => {
    const { currencyWallets } = state.core.account
    const { existingWalletId } = params

    const handleActivationInfo = state.ui.scenes.createWallet.handleActivationInfo
    const walletAccountActivationPaymentInfo = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
    const { supportedCurrencies, activationCost } = handleActivationInfo
    const { currencyCode, amount } = walletAccountActivationPaymentInfo
    const existingCoreWallet = existingWalletId ? currencyWallets[existingWalletId] : undefined
    const paymentDenomination =
      currencyCode != null && existingCoreWallet != null ? getExchangeDenomination(state, existingCoreWallet.currencyInfo.pluginId, currencyCode) : {}

    let paymentDenominationSymbol
    if (paymentDenomination) {
      // @ts-expect-error
      paymentDenominationSymbol = paymentDenomination.symbol ? paymentDenomination.symbol : ''
    } else {
      paymentDenominationSymbol = ''
    }
    const walletAccountActivationQuoteError = state.ui.scenes.createWallet.walletAccountActivationQuoteError
    return {
      account: state.core.account,
      paymentCurrencyCode: currencyCode,
      amount,
      supportedCurrencies,
      activationCost,
      paymentDenominationSymbol,
      existingCoreWallet,
      walletAccountActivationQuoteError
    }
  },
  dispatch => ({
    createAccountTransaction(navigation: NavigationBase, createdWalletId: string, accountName: string, paymentWalletId: string) {
      dispatch(createAccountTransaction(navigation, createdWalletId, accountName, paymentWalletId))
    },
    fetchAccountActivationInfo(walletType: string) {
      dispatch(fetchAccountActivationInfo(walletType))
    },
    fetchWalletAccountActivationPaymentInfo(paymentInfo: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) {
      dispatch(fetchWalletAccountActivationPaymentInfo(paymentInfo, createdCoreWallet))
    },
    async createAccountBasedWallet(walletName: string, walletType: string, fiatCurrencyCode: string) {
      return await dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
    },
    setWalletAccountActivationQuoteError(message) {
      dispatch({ type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: message })
    }
  })
)(CreateWalletAccountSelect)
