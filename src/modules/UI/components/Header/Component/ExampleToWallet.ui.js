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
  constructor(props) {
    super(props)
    //this.state = { walletListModalVisibility: true }
  }

  _onPressDropdownToggle = () => {
    //this.setState({walletListModalVisibility: !this.state.walletListModalVisibility})
    this.props.dispatch(toggleWalletListModalVisibility())
  }

  render () {
    let topDisplacement =  66
    let selectionFunction = 'selectToWallet'
    return (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <TouchableOpacity onPress={this._onPressDropdownToggle}>
                <View>
                  {!this.props.walletListModalVisible && !this.props.addressModalVisible && 
                  <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
                  }
                    
                </View>
            </TouchableOpacity>
            {this.props.walletListModalVisible && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} /> }
          </View>
    )
  }
}

export default connect(state => ({ 
  addressModalVisible: state.ui.scenes.scan.addressModalVisible,
  walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible
})
)(ExampleToWallet)