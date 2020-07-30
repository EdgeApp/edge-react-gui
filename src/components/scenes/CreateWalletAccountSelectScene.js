// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import eosLogo from '../../assets/images/currencies/fa_logo_eos.png'
import steemLogo from '../../assets/images/currencies/fa_logo_steem.png'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { CreateWalletType, GuiFiatType, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { logEvent } from '../../util/tracking.js'
import { fixFiatCurrencyCode } from '../../util/utils.js'
import { Airship } from '../services/AirshipInstance.js'

const logos = {
  eos: eosLogo,
  steem: steemLogo
}

export type AccountPaymentParams = {
  requestedAccountName: string,
  currencyCode: string,
  ownerPublicKey: string,
  activePublicKey: string
}

export type CreateWalletAccountSelectStateProps = {
  wallets: { [string]: GuiWallet },
  paymentCurrencyCode: string,
  paymentAddress: string,
  amount: string,
  expireTime: string,
  supportedCurrencies: { [string]: boolean },
  activationCost: string,
  isCreatingWallet: boolean,
  paymentDenominationSymbol: string,
  existingCoreWallet: EdgeCurrencyWallet,
  walletAccountActivationQuoteError: string
}

export type CreateWalletAccountSelectOwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  accountName: string,
  isReactivation?: boolean,
  existingWalletId?: string
}

export type CreateWalletAccountSelectDispatchProps = {
  createAccountBasedWallet: (string, string, string, boolean, boolean) => any,
  fetchAccountActivationInfo: string => void,
  createAccountTransaction: (string, string, string) => void,
  fetchWalletAccountActivationPaymentInfo: (AccountPaymentParams, EdgeCurrencyWallet) => void,
  setWalletAccountActivationQuoteError: string => void
}

type Props = CreateWalletAccountSelectOwnProps & CreateWalletAccountSelectDispatchProps & CreateWalletAccountSelectStateProps

type State = {
  walletName: string,
  walletId: string,
  error: string,
  createdWallet: Promise<EdgeCurrencyWallet>
}

export class CreateWalletAccountSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { selectedFiat, selectedWalletType, createAccountBasedWallet, accountName } = props
    let createdWallet
    if (props.existingWalletId) {
      createdWallet = this.renameAndReturnWallet(props.existingCoreWallet)
    } else {
      createdWallet = createAccountBasedWallet(accountName, selectedWalletType.walletType, fixFiatCurrencyCode(selectedFiat.value), false, false)
    }
    this.state = {
      error: '',
      walletId: '',
      walletName: '',
      createdWallet
    }
    const currencyCode = props.selectedWalletType.currencyCode
    props.fetchAccountActivationInfo(currencyCode)
  }

  renameAndReturnWallet = async (wallet: EdgeCurrencyWallet) => {
    const { accountName } = this.props
    await wallet.renameWallet(accountName)
    return wallet
  }

  componentDidMount() {
    logEvent('ActivateWalletSelect')
  }

  onBack = () => {
    Actions.pop()
  }

  onPressSelect = () => {
    const { supportedCurrencies } = this.props
    const allowedCurrencyCodes = []
    for (const currency in supportedCurrencies) {
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
    const { createAccountTransaction, accountName } = this.props
    const { walletId } = this.state
    const createdWallet = await this.state.createdWallet
    const createdWalletId = createdWallet.id
    // will grab data from state in actions
    createAccountTransaction(createdWalletId, accountName, walletId)
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { wallets, accountName, fetchWalletAccountActivationPaymentInfo, setWalletAccountActivationQuoteError } = this.props
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
      activePublicKey: createdWallet.publicWalletInfo.keys.publicKey
    }

    fetchWalletAccountActivationPaymentInfo(paymentInfo, createdWallet)
  }

  renderSelectWallet = () => {
    const { activationCost, selectedWalletType } = this.props
    const currencyCode = selectedWalletType.currencyCode
    const isSelectWalletDisabled = !activationCost || activationCost === ''
    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={this.onPressSelect}>
            {isSelectWalletDisabled ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.create_wallet_account_select_wallet}</PrimaryButton.Text>}
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
    const {
      wallets,
      paymentCurrencyCode,
      accountName,
      isCreatingWallet,
      amount,
      selectedWalletType,
      selectedFiat,
      activationCost,
      paymentDenominationSymbol
    } = this.props
    const { walletId, createdWallet } = this.state
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
              {symbolImageDarkMono && <Image style={styles.paymentLeftIcon} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
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
            {isContinueButtonDisabled ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.legacy_address_modal_continue}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
      </View>
    )
  }

  render() {
    const { supportedCurrencies, selectedWalletType, activationCost, wallets, walletAccountActivationQuoteError } = this.props
    const { walletId } = this.state
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
    for (const currency in supportedCurrencies) {
      if (supportedCurrencies[currency]) {
        supportedCurrenciesList.push(currency)
      }
    }

    const walletsCopy = { ...wallets }
    for (const id in walletsCopy) {
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
              <Image source={logos.eos} style={styles.currencyLogo} resizeMode="cover" />
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
