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
import WalletListModal from '../../WalletListModal/WalletListModal.ui'
import { connect } from 'react-redux'

class ExampleToWallet extends Component {

  _onPressDropdownToggle = () => {
    console.log('')
    this.props.dispatch(toggleWalletListModalVisibility())
  }

  render () {
    return (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <TouchableHighlight onPress={this._onPressDropdownToggle}>
                <View>
                  <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
                </View>
            </TouchableHighlight>
            <WalletListModal />
          </View>
    )
  }
}

export default connect(state => ({
  torchEnabled: state.ui.scan.torchEnabled,
  addressModalVisible: state.ui.scan.addressModalVisible,
  receipientAddress: state.ui.scan.recipientAddress,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible
})
)(ExampleToWallet)