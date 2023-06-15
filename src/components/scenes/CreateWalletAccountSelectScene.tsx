import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import {
  createAccountTransaction,
  createCurrencyWallet,
  fetchAccountActivationInfo,
  fetchWalletAccountActivationPaymentInfo
} from '../../actions/CreateWalletActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeTokenId } from '../../types/types'
import { guessFromCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { scale } from '../../util/scaling'
import { logEvent } from '../../util/tracking'
import { fixFiatCurrencyCode } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText as Text } from '../legacy/FormattedText/FormattedText.ui'
import { Airship } from '../services/AirshipInstance'

export interface AccountPaymentParams {
  requestedAccountName: string
  currencyCode: string
  ownerPublicKey: string
  activePublicKey: string
  requestedAccountCurrencyCode: string
}

interface OwnProps extends EdgeSceneProps<'createWalletAccountSelect'> {}

interface StateProps {
  account: EdgeAccount
  paymentCurrencyCode: string
  amount: string
  supportedAssets: EdgeTokenId[]
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
    const { supportedAssets } = this.props

    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={this.props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={supportedAssets} />
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
              <PrimaryButton.Text>{lstrings.create_wallet_account_select_wallet}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
        <View style={styles.paymentArea}>
          <Text style={styles.paymentLeft}>{lstrings.create_wallet_account_amount_due}</Text>
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
            {lstrings.create_wallet_crypto_type_label} {selectedWalletType.currencyCode}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {lstrings.create_wallet_fiat_type_label} {selectedFiat.label}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {lstrings.create_wallet_name_label} {accountName}
          </Text>
        </View>
        <View style={styles.accountReviewConfirmArea}>
          <Text style={styles.accountReviewConfirmText}>{lstrings.create_wallet_account_confirm}</Text>
        </View>
        <View style={styles.confirmButtonArea}>
          <PrimaryButton disabled={isContinueButtonDisabled} style={styles.confirmButton} onPress={this.onPressSubmit}>
            {/* we want it disabled with activity indicator if creating wallet, or wallet is created and pending quote */}
            {isContinueButtonDisabled ? (
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
            ) : (
              <PrimaryButton.Text>{lstrings.legacy_address_modal_continue}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
      </View>
    )
  }

  render() {
    const { account, route, activationCost, walletAccountActivationQuoteError } = this.props
    const { selectedWalletType } = route.params
    const { walletId } = this.state

    const instructionSyntax = sprintf(
      lstrings.create_wallet_account_select_instructions_with_cost,
      selectedWalletType.currencyCode,
      selectedWalletType.currencyCode,
      config.appNameShort,
      `${activationCost} ${selectedWalletType.currencyCode}`
    )
    const confirmMessageSyntax = sprintf(lstrings.create_wallet_account_make_payment, selectedWalletType.currencyCode)

    const { tokenId } = guessFromCurrencyCode(account, { currencyCode: selectedWalletType.currencyCode })

    return (
      <SceneWrapper>
        <View style={styles.scene}>
          <ScrollView>
            <View style={styles.scrollableView}>
              <CryptoIcon marginRem={[1.5, 0, 0, 0]} sizeRem={4} tokenId={tokenId} />
              <View style={styles.createWalletPromptArea}>
                <Text style={styles.instructionalText}>{!walletId || walletAccountActivationQuoteError ? instructionSyntax : confirmMessageSyntax}</Text>
              </View>
              {!walletId || walletAccountActivationQuoteError ? this.renderSelectWallet() : this.renderPaymentReview()}
            </View>
            <View style={{ paddingBottom: 200 }} />
          </ScrollView>
        </View>
      </SceneWrapper>
    )
  }
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
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

    const handleActivationInfo = state.ui.createWallet.handleActivationInfo
    const walletAccountActivationPaymentInfo = state.ui.createWallet.walletAccountActivationPaymentInfo
    const { supportedAssets, activationCost } = handleActivationInfo
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
    const walletAccountActivationQuoteError = state.ui.createWallet.walletAccountActivationQuoteError
    return {
      account: state.core.account,
      paymentCurrencyCode: currencyCode,
      amount,
      supportedAssets,
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
