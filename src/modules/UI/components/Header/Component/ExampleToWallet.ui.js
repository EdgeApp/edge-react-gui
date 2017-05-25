import React, { Component } from 'react'
import { Text, TouchableOpacity, View, TouchableHighlight } from 'react-native'
import { Icon, Title } from 'native-base'
import { Actions } from 'react-native-router-flux'
import { 
  toggleWalletListModalVisibility, 
  enableWalletListModalVisibility, 
  disableWalletListModalVisibility
} from '../../WalletListModal/action'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import {WalletListModalConnect} from '../../WalletListModal/WalletListModal.ui'
import { connect } from 'react-redux'

class ExampleToWallet extends Component {

  _onPressDropdownToggle = () => {
    this.props.dispatch(toggleWalletListModalVisibility())
  }

  render () {
    let topDisplacement =  this.props.headerHeight + 2
    let selectionFunction = 'selectToWallet'
    return (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <TouchableHighlight onPress={this._onPressDropdownToggle}>
                <View>
                  {!this.props.walletListModalVisible && !this.props.addressModalVisible && 
                  <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
                  }
                    
                </View>
            </TouchableHighlight>
            {this.props.walletListModalVisible && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} /> }
          </View>
    )
  }
}

export default connect(state => ({
  headerHeight: state.ui.dimensions.headerHeight,  
  addressModalVisible: state.ui.scan.addressModalVisible,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible
})
)(ExampleToWallet)