// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import {
  createAccountTransaction,
  createCurrencyWallet,
  fetchAccountActivationInfo,
  fetchWalletAccountActivationPaymentInfo
} from '../../actions/CreateWalletActions.js'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { SafeAreaViewComponent as SafeAreaView } from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { logEvent } from '../../util/tracking.js'
import { fixFiatCurrencyCode } from '../../util/utils.js'
import { Airship } from '../services/AirshipInstance.js'

export type AccountPaymentParams = {
  requestedAccountName: string,
  currencyCode: string,
  ownerPublicKey: string,
  activePublicKey: string,
  requestedAccountCurrencyCode: string
}

type OwnProps = {
  route: RouteProp<'createWalletAccountSelect'>
}

type StateProps = {
  wallets: { [string]: GuiWallet },
  paymentCurrencyCode: string,
  amount: string,
  supportedCurrencies: { [currencyCode: string]: boolean },
  activationCost: string,
  paymentDenominationSymbol: string,
  existingCoreWallet?: EdgeCurrencyWallet,
  walletAccountActivationQuoteError: string,
  currencyConfigs: { [key: string]: EdgeCurrencyConfig }
}

type DispatchProps = {
  createAccountBasedWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => Promise<EdgeCurrencyWallet>,
  fetchAccountActivationInfo: (walletType: string) => void,
  createAccountTransaction: (createdWalletId: string, accountName: string, paymentWalletId: string) => void,
  fetchWalletAccountActivationPaymentInfo: (paymentInfo: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) => void,
  setWalletAccountActivationQuoteError: (message: string) => void
}

type Props = OwnProps & DispatchProps & StateProps

type State = {
  isCreatingWallet: boolean,
  walletName: string,
  walletId: string,
  error: string,
  createdWallet: Promise<EdgeCurrencyWallet>
}

class CreateWalletAccountSelect extends React.Component<Props, State> {
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
      walletName: '',
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
    logEvent('ActivateWalletSelect')
  }

  onPressSelect = () => {
    const { supportedCurrencies } = this.props
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

  onPressSubmit = async () => {
    const { createAccountTransaction, route } = this.props
    const { accountName } = route.params
    const { walletId } = this.state
    const createdWallet = await this.state.createdWallet
    const createdWalletId = createdWallet.id
    // will grab data from state in actions
    createAccountTransaction(createdWalletId, accountName, walletId)
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { fetchWalletAccountActivationPaymentInfo, setWalletAccountActivationQuoteError, wallets, route } = this.props
    const { accountName, selectedWalletType } = route.params
    setWalletAccountActivationQuoteError('') // reset fetching quote error to falsy
    const paymentWallet = wallets[walletId]
    const walletName = paymentWallet.name
    this.setState({
      walletId,
      walletName
    })
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
    const { wallets, paymentCurrencyCode, amount, activationCost, paymentDenominationSymbol, route } = this.props
    const { walletId, createdWallet, isCreatingWallet } = this.state
    const { accountName, selectedWalletType, selectedFiat } = route.params

    const wallet = wallets[walletId]
    if (!wallet) return null
    const { name, symbolImageDarkMono } = wallet

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
              {symbolImageDarkMono && <FastImage style={styles.paymentLeftIcon} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
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
    const { route, currencyConfigs, supportedCurrencies, activationCost, wallets, walletAccountActivationQuoteError } = this.props
    const { selectedWalletType } = route.params
    const { walletId } = this.state
    const walletTypeValue = selectedWalletType.walletType.replace('wallet:', '')
    const { symbolImage } = getCurrencyIcon(currencyConfigs[walletTypeValue].currencyInfo.pluginId)
    const instructionSyntax = sprintf(
      s.strings.create_wallet_account_select_instructions_with_cost,
      selectedWalletType.currencyCode,
      selectedWalletType.currencyCode,
      'Edge',
      `${activationCost} ${selectedWalletType.currencyCode}`
    )
    const confirmMessageSyntax = sprintf(s.strings.create_wallet_account_make_payment, selectedWalletType.currencyCode)
    // only included supported types of payment in WalletListModal
    const supportedCurrenciesList = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        supportedCurrenciesList.push(currency)
      }
    }

    const walletsCopy = { ...wallets }
    for (const id of Object.keys(walletsCopy)) {
      if (!supportedCurrenciesList.includes(walletsCopy[id].currencyCode)) {
        delete walletsCopy[id]
      }
    }

    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.scrollableGradient} />
          <ScrollView>
            <View style={styles.scrollableView}>
              <FastImage source={{ uri: symbolImage }} style={styles.currencyLogo} resizeMode="cover" />
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

const rawStyles = {
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
  currencyLogo: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(64),
    width: scale(64)
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
  paymentLeftIcon: {
    width: scale(22),
    height: scale(22)
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
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const CreateWalletAccountSelectScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => {
    const { currencyWallets } = state.core.account
    const { existingWalletId } = params

    const wallets = state.ui.wallets.byId
    const handleActivationInfo = state.ui.scenes.createWallet.handleActivationInfo
    const walletAccountActivationPaymentInfo = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
    const { supportedCurrencies, activationCost } = handleActivationInfo
    const { currencyCode, amount } = walletAccountActivationPaymentInfo
    const existingCoreWallet = existingWalletId ? currencyWallets[existingWalletId] : undefined
    const paymentDenomination =
      currencyCode != null && existingCoreWallet != null ? getExchangeDenomination(state, existingCoreWallet.currencyInfo.pluginId, currencyCode) : {}

    let paymentDenominationSymbol
    if (paymentDenomination) {
      paymentDenominationSymbol = paymentDenomination.symbol ? paymentDenomination.symbol : ''
    } else {
      paymentDenominationSymbol = ''
    }
    const walletAccountActivationQuoteError = state.ui.scenes.createWallet.walletAccountActivationQuoteError
    return {
      paymentCurrencyCode: currencyCode,
      amount,
      supportedCurrencies,
      activationCost,
      wallets,
      paymentDenominationSymbol,
      existingCoreWallet,
      walletAccountActivationQuoteError,
      currencyConfigs: state.core.account.currencyConfig
    }
  },
  dispatch => ({
    createAccountTransaction(createdWalletId: string, accountName: string, paymentWalletId: string) {
      dispatch(createAccountTransaction(createdWalletId, accountName, paymentWalletId))
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
