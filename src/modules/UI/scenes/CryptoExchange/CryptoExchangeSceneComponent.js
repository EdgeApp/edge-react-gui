//@flow
import React, {Component} from 'react'
import strings from '../../../../locales/default'
import * as Constants from '../../../../constants/indexConstants'
import Gradient from '../../../UI/components/Gradient/Gradient.ui'
import CryptoExchangeConnector
  from '../../../../connectors/components/CryptoExchangeRateConnector'
import {ScrollView, View} from 'react-native'
import {CryptoExchangeSceneStyle} from '../../../../styles/indexStyles'
import CryptoExchangeFlipConnector
  from '../../../../connectors/components/CryptoExchangeFlipConnector'
import {PrimaryButton} from '../../components/Buttons/index'
import WalletListModal
  from '../../../UI/components/WalletListModal/WalletListModalConnector'
import CryptoExchangeConfirmTransactionModalComponent from './CryptoExchangeConfirmTransactionModalComponent'
import {IconButton} from '../../components/Buttons/IconButton.ui'
import {GuiWallet} from '../../../../types'

type Props ={
  exchangeRate: number,
  wallets: Array<GuiWallet>,
  intialWalletOne: GuiWallet,
  intialWalletTwo: GuiWallet,
  fromWallet: GuiWallet,
  toWallet: GuiWallet,
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  toCurrencyIcon: string,
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
export default class CryptoExchangeSceneComponent extends Component<Props> {

  componentWillMount () {
    if (this.props.wallets.length > 1) {
      this.props.selectFromWallet(this.props.intialWalletOne)
      this.props.selectToWallet(this.props.intialWalletTwo)
    } else if (this.props.wallets.length > 0) {
      this.props.selectFromWallet(this.props.intialWalletOne)
    }
  }
  componentWillReceiveProps (nextProps: Props) {
    if (!nextProps.fromWallet && nextProps.intialWalletOne) {
      this.props.selectFromWallet(nextProps.intialWalletOne)
    }
    if (!nextProps.toWallet && nextProps.intialWalletTwo) {
      this.props.selectToWallet(nextProps.intialWalletTwo)
    }
  }
  renderButton = () => {
    if (this.props.showNextButton) {
      return <PrimaryButton text={strings.enUS['string_next']} onPressFunction={this.props.openConfirmation} />
    }
    return null
  }

  flipThis = () => {
    this.props.swapFromAndToWallets()
  }

  launchWalletSelector = (arg: string) => {
    this.props.openModal(arg)
  }

  renderDropUp = () => {
    if (this.props.showWalletSelectModal) {
      return (
        <WalletListModal
          topDisplacement={33}
          type={Constants.CRYPTO_EXCHANGE}
        />
      )
    }
    return null
  }
  renderConfirmation = (style: any) => {
    if (this.props.showConfirmShiftModal) {
      return (
        <CryptoExchangeConfirmTransactionModalComponent
          style={style}
          closeFunction={this.props.closeConfirmation}
          fromCurrencyIcon={this.props.fromCurrencyIcon}
          fromCurrencyAmount={this.props.fromDisplayAmount}
          fromCurrencyCode={this.props.fromCurrencyCode}
          toCurrencyIcon={this.props.toCurrencyIcon}
          toCurrencyAmount={this.props.toDisplayAmount}
          toCurrencyCode={this.props.toCurrencyCode}
          fee={this.props.fee}
          confirmFunction={this.props.shift}
        />
      )
    }
    return null
  }

  render () {
    const style = CryptoExchangeSceneStyle
    return (
      <Gradient style={[style.scene]}>
        <ScrollView
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
        </ScrollView>
        {this.renderDropUp()}
        {this.renderConfirmation(style.confirmModal)}
      </Gradient>
    )
  }
}
