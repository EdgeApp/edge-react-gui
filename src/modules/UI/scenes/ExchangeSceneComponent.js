//@flow
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import strings from '../../../locales/default'
import * as Constants from '../../../constants/indexConstants'
import Gradient from '../../UI/components/Gradient/Gradient.ui'
import CryptoExchangeConnector
  from '../../../connectors/components/CryptoExchangeRateConnector'
import {ScrollView, View} from 'react-native'
import {CryptoExchangeSceneStyle} from '../../../styles/indexStyles'
import CryptoExchangeFlipConnector
  from '../../../connectors/components/CryptoExchangeFlipConnector'
import {PrimaryButton} from '../components/Buttons/index'
import WalletListModal
  from '../../UI/components/WalletListModal/WalletListModalConnector'
import {IconButton} from '../components/Buttons/IconButton.ui'
import type {GuiWallet} from '../../../types'
type Props ={
  exchangeRate: string,
  wallets: Array<GuiWallet>,
  intialWalletOne: GuiWallet,
  intialWalletTwo: GuiWallet,
  fromWallet: GuiWallet,
  toWallet: GuiWallet,
  fee: string,
  showModal: boolean,
  selectFromWallet: Function,
  selectToWallet: Function,
  swapFromAndToWallets: Function,
  openModal: Function

}
export default class ExchangeSceneComponent extends Component<Props> {
  static propTypes = {
    exchangeRate: PropTypes.string,
    wallets: PropTypes.array,
    intialWalletOne: PropTypes.instanceOf.GuiWallet,
    intialWalletTwo: PropTypes.instanceOf.GuiWallet,
    fromWallet: PropTypes.instanceOf.GuiWallet,
    toWallet: PropTypes.instanceOf.GuiWallet,
    fee: PropTypes.string,
    showModal: PropTypes.bool,
    selectFromWallet: PropTypes.func.isRequired,
    selectToWallet: PropTypes.func.isRequired,
    swapFromAndToWallets: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
  }
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
  flipThis = () => {
    this.props.swapFromAndToWallets()
  }

  launchWalletSelector = (arg: string) => {
    this.props.openModal(arg)
  }

  renderDropUp = () => {
    if (this.props.showModal) {
      return (
        <WalletListModal
          topDisplacement={'33'}
          type='from'
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
            whichWallet={Constants.TO}
            launchWalletSelector={this.launchWalletSelector}
            uiWallet={this.props.toWallet}
          />
          <View style={style.shim} />
          <View style={style.actionButtonContainer} >
            <PrimaryButton text={strings.enUS['string_next']} />
          </View>
        </ScrollView>
        {this.renderDropUp()}
      </Gradient>
    )
  }
}
