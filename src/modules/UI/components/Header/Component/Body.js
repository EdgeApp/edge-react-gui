import React, { Component } from 'react'
import { Text, TouchableOpacity, View, TouchableHighlight } from 'react-native'
import { Icon, Title } from 'native-base'
import { Actions } from 'react-native-router-flux'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import { toggleScanFromWalletListModal, toggleScanToWalletListModal} from '../../WalletListModal/action'

import { 
  toggleWalletListModalVisibility, 
  enableWalletListModalVisibility, 
  disableWalletListModalVisibility
} from '../../WalletListModal/action'
import {WalletListModalConnect} from '../../WalletListModal/WalletListModal.ui'
import { connect } from 'react-redux'
import ExampleToWallet from './ExampleToWallet.ui'

class Body extends Component {
  constructor(props) {
    super(props)
  }

  render () {  
    switch(this.props.routes.scene.sceneKey) {
      case 'scan':
        return <ExampleFromWalletConnect  walletList={this.props.walletList} toggleFunction='_onPressScanFromDropdownToggle' visibleFlag='scanFromWalletListModalVisibility' /> 
      case 'request':
        return <ExampleFromWalletConnect  walletList={this.props.walletList} />
      case 'transactions':
        return <ExampleFromWalletConnect walletList={this.props.walletList} toggleFunction='_onPressTransactionsDropdownToggle' visibleFlag='walletListModalVisible' />
      default:
        return <DefaultHeader routes={this.props.routes} />
    }
  }
}
export default connect((state) => ({
  walletList: state.ui.wallets.byId,
  headerHeight: state.ui.dimensions.headerHeight
}))(Body)


class DefaultHeader extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return <Title>{ this._renderTitle() }</Title>
  }

}

class ExampleFromWallet extends Component {

  _onPressDropdownToggle = () => {
    this.props.dispatch(toggleWalletListModalVisibility())
  }

  _onPressTransactionsDropdownToggle = () => {
    console.log('inside onPressTransactionsDropdownToggle')
  }

  _onPressScanFromDropdownToggle = () => {
    console.log('inside onPressScanFromDropdownToggle')
    this.props.dispatch(toggleScanFromWalletListModal())
  }

  _onPressScanToDropdownToggle = () => {
    console.log('inside onPressScanToDropdownToggle')
  }  

  render () {
    let topDisplacement =  this.props.headerHeight + 2
    let selectionFunction = 'selectFromWallet'    

    return (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <TouchableHighlight onPress={this[this.props.toggleFunction]}>
                <View>
                  {!this.props.walletListModalVisible && !this.props.addressModalVisible && 
                  <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
                  }
                    
                </View>
            </TouchableHighlight>
            {this.props[this.props.visibleFlag] && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} /> }
          </View>
    )
  }
}
export const ExampleFromWalletConnect  = connect( state => ({
    walletList: state.ui.wallets.byId,
    scanFromWalletListModalVisibility: state.ui.scan.scanFromWalletListModalVisibility,
    scanToWalletListModalVisibility: state.ui.scan.scanToWalletListModalVisibility,
    headerHeight: state.ui.dimensions.headerHeight    
}))(ExampleFromWallet)