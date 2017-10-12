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

export default class ExchangeSceneComponent extends Component {
  componentWillMount () {
    if (this.props.wallets.length > 1) {
      this.props.selectFromWallet(this.props.intialWalletOne)
      this.props.selectToWallet(this.props.intialWalletTwo)
    } else if (this.props.wallets.length > 0) {
      this.props.selectFromWallet(this.props.intialWalletOne)
    }
  }
  componentWillReceiveProps (nextProps) {
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

  launchWalletSelector = (arg) => {
    this.props.openModal(arg)
  }

  renderDropUp = () => {
    if (this.props.showModal) {
      return (
        <WalletListModal
          topDisplacement={'33'}
          selectionFunction={this.selectionFunction}
          type='from'
        />
      )
    }
    return null
  }

  selectionFunction = (arg) => {
    console.log('SELECTION FUNCTION ' + arg)
    this.setState({
      showModal: false
    })
  }

  render () {
    const style = CryptoExchangeSceneStyle
    console.log(style)
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
            launchWalletSelector={this.launchWalletSelector.bind(this)}
            fee={this.props.fee}
          />
          <View style={style.shim} />
          <IconButton
            style={style.flipButton}
            icon={Constants.SWAP_VERT}
            onPress={this.flipThis.bind(this)}
          />
          <View style={style.shim} />
          <CryptoExchangeFlipConnector
            style={style.flipWrapper}
            whichWallet={Constants.TO}
            launchWalletSelector={this.launchWalletSelector.bind(this)}
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

ExchangeSceneComponent.propTypes = {
  exchangeRate: PropTypes.string
}
