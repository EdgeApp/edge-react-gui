// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import s from '../../../../locales/strings.js'
import * as Constants from '../../../../constants/indexConstants'
import Gradient from '../../../UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import CryptoExchangeConnector
  from '../../../../connectors/components/CryptoExchangeRateConnector'
import {CryptoExchangeSceneStyle} from '../../../../styles/indexStyles'
import CryptoExchangeFlipConnector
  from '../../../../connectors/components/CryptoExchangeFlipConnector'
import {PrimaryButton} from '../../components/Buttons/index'
import WalletListModal
  from '../../../UI/components/WalletListModal/WalletListModalConnector'
import CryptoExchangeConfirmTransactionModalComponent from './CryptoExchangeConfirmTransactionModalComponent'
import {IconButton} from '../../components/Buttons/IconButton.ui'
import {GuiWallet} from '../../../../types'

type Props = {
  exchangeRate: number,
  wallets: Array<GuiWallet>,
  intialWalletOne: GuiWallet,
  intialWalletTwo: GuiWallet,
  fromWallet: GuiWallet,
  toWallet: GuiWallet,
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  fromCurrencyIconDark: string,
  toCurrencyIcon: string,
  toCurrencyIconDark: string,
  toCurrencyCode: string,
  toDisplayAmount: string,
  fromDisplayAmount: string,
  fromAmountNative: string,
  toAmountNative: number,
  fee: string,
  showNextButton?: string,
  showWalletSelectModal: boolean,
  showConfirmShiftModal: boolean,
  selectFromWallet: Function,
  selectToWallet: Function,
  swapFromAndToWallets: Function,
  openModal: Function,
  shift: Function,
  openConfirmation: Function,
  closeConfirmation: Function
}
type State = {
  whichWallet: string
}
export default class CryptoExchangeSceneComponent extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      whichWallet: Constants.FROM
    })
  }

  render () {
    const style = CryptoExchangeSceneStyle
    return (
      <SafeAreaView>
        <Gradient style={[style.scene]}>
          <Gradient style={style.gradient} />
          <KeyboardAwareScrollView
            style={[style.mainScrollView]}
            keyboardShouldPersistTaps={Constants.ALWAYS}
            contentContainerStyle={style.scrollViewContentContainer}
          >
            <CryptoExchangeConnector style={style.exchangeRateBanner} />
            <View style={style.shim} />
            <CryptoExchangeFlipConnector
              style={style.flipWrapper}
              uiWallet={this.props.fromWallet}
              currencyCode={this.props.fromCurrencyCode}
              whichWallet={Constants.FROM}
              launchWalletSelector={this.launchWalletSelector}
              fee={this.props.fee}
            />
            <View style={style.shim} />
            <IconButton
              style={style.flipButton}
              icon={Constants.SWAP_VERT}
              onPress={this.flipThis}
            />
            <View style={style.shim} />
            <CryptoExchangeFlipConnector
              style={style.flipWrapper}
              uiWallet={this.props.toWallet}
              currencyCode={this.props.toCurrencyCode}
              whichWallet={Constants.TO}
              launchWalletSelector={this.launchWalletSelector}
            />
            <View style={style.shim} />
            <View style={style.actionButtonContainer} >
              {this.renderButton()}
            </View>
          </KeyboardAwareScrollView>
          {this.renderDropUp()}
          {this.renderConfirmation(style.confirmModal)}
        </Gradient>
      </SafeAreaView>
    )
  }

  renderButton = () => {
    if (this.props.showNextButton) {
      return <PrimaryButton text={s.strings.string_next} onPressFunction={this.props.openConfirmation} />
    }
    return null
  }

  flipThis = () => {
    this.props.swapFromAndToWallets()
  }

  launchWalletSelector = (arg: string) => {
    this.props.openModal(arg)
    this.setState({
      whichWallet: arg
    })
  }

  renderDropUp = () => {
    if (this.props.showWalletSelectModal) {
      return (
        <WalletListModal
          topDisplacement={Constants.CRYPTO_EXCHANGE_WALLET_DIALOG_TOP}
          type={Constants.CRYPTO_EXCHANGE}
          whichWallet={this.state.whichWallet}
        />
      )
    }
    return null
  }

  renderConfirmation = (style: Object) => {
    if (this.props.showConfirmShiftModal) {
      return (
        <CryptoExchangeConfirmTransactionModalComponent
          style={style}
          fromWallet={this.props.fromWallet}
          toWallet={this.props.toWallet}
          closeFunction={this.props.closeConfirmation}
          fromCurrencyIconDark={this.props.fromCurrencyIconDark}
          fromCurrencyAmount={this.props.fromDisplayAmount}
          fromCurrencyCode={this.props.fromCurrencyCode}
          toCurrencyIconDark={this.props.toCurrencyIconDark}
          toCurrencyAmount={this.props.toDisplayAmount}
          toCurrencyCode={this.props.toCurrencyCode}
          fee={this.props.fee}
          confirmFunction={this.props.shift}
        />
      )
    }
    return null
  }
}
