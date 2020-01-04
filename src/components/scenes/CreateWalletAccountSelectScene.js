// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import eosLogo from '../../assets/images/currencies/fa_logo_eos.png'
import steemLogo from '../../assets/images/currencies/fa_logo_steem.png'
import { WalletListModalConnected as WalletListModal } from '../../connectors/components/WalletListModalConnector.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import type { GuiFiatType, GuiWallet, GuiWalletType } from '../../types/types.js'
import { trackEvent } from '../../util/tracking.js'
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
  selectedWalletType: GuiWalletType,
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

export class CreateWalletAccountSelect extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const { selectedFiat, selectedWalletType, createAccountBasedWallet, accountName } = props
    let createdWallet
    if (props.existingWalletId) {
      createdWallet = this.renameAndReturnWallet(props.existingCoreWallet)
    } else {
      createdWallet = createAccountBasedWallet(accountName, selectedWalletType.value, fixFiatCurrencyCode(selectedFiat.value), false, false)
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

  componentDidMount () {
    trackEvent('ActivateWalletSelect')
  }

  onBack = () => {
    Actions.pop()
  }

  onPressSelect = () => {
    const { supportedCurrencies, wallets } = this.props
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (supportedCurrencies[wallet.currencyCode]) {
        allowedWallets.push(wallets[id])
      }
    }
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        existingWalletToFilterId={''}
        existingWalletToFilterCurrencyCode={''}
        supportedWalletTypes={[]}
        excludedCurrencyCode={[]}
        showWalletCreators={false}
        headerTitle={s.strings.select_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: GuiWallet | Object | null) => {
      if (response) {
        this.onSelectWallet(response.id, response.currencyCode)
      }
    })
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
          <PrimaryButton disabled={isSelectWalletDisabled} style={[styles.next]} onPress={this.onPressSelect}>
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
          <PrimaryButton disabled={isContinueButtonDisabled} style={[styles.confirmButton]} onPress={this.onPressSubmit}>
            {/* we want it disabled with activity indicator if creating wallet, or wallet is created and pending quote */}
            {isContinueButtonDisabled ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.legacy_address_modal_continue}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
      </View>
    )
  }

  render () {
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
              <Image source={logos['eos']} style={styles.currencyLogo} resizeMode={'cover'} />
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
