import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon, Title } from 'native-base';
import { Actions } from 'react-native-router-flux'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu';

import { 
  toggleWalletListModalVisibility, 
  enableWalletListModalVisibility, 
  disableWalletListModalVisibility
} from '../../WalletListModal/action'
import WalletListModal from '../../WalletListModal/WalletListModal.ui'
import { connect } from 'react-redux'
//import ExampleToWallet from './ExampleToWallet.ui'

class Body extends Component {
  constructor(props) {
    super(props)
  }

  render () {
    console.log('in Body and HeaderHeight is: ', this.props.headerHeight)
    switch(this.props.routes.scene.sceneKey) {
      case 'scan':
        return <ExampleMyWallet  walletList={this.props.walletList} /> 
      case 'request':
        return <ExampleMyWallet  walletList={this.props.walletList} />
      case 'transactions':
        return <ExampleToWallet headerHeight={this.props.headerHeight} walletList={this.props.walletList} />
      default:
        return <DefaultHeader routes={this.props.routes} />
    }
  }
}
export default connect((state) => ({
  walletList: state.ui.wallets.byId
}))(Body)


class DefaultHeader extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return <Title>{ this._renderTitle() }</Title>
  }

}

class ExampleMyWallet extends Component {
  constructor(props) {
    super(props)
  }

  render () {
    console.log('ExampleMyWallet this.props is: ', this.props)
    return (
      <Menu onSelect={(value) => alert(`User selected your ${value}`)}>
        <MenuTrigger>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
          </View>
        </MenuTrigger>
        <MenuOptions>
          {Object.keys(this.props.walletList).map( (key) => {
            return (
              <MenuOption value={key.slice(0,5)} key={key}>
                <Text>{key.slice(0,5)}</Text>
              </MenuOption>
            )
          })}        
        </MenuOptions>
      </Menu>
    )
  }

}

class ExampleToWallet extends Component {
  constructor(props) {
    super(props)
  }

  render () {
  console.log('in ExampleToMyWallet this.props.walletList is: ', this.props.walletList)       
    return (
      <Menu onSelect={(value) => alert(`User selected ${value} to transfer to`)}>
        <MenuTrigger>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>To Wallet  </Text>
            <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
          </View>
        </MenuTrigger>
        <MenuOptions>
          {Object.keys(this.props.walletList).map( (key) => {
            return (
              <MenuOption value={key.slice(0,5)} key={key}>
                <Text>{key.slice(0,5)}</Text>
              </MenuOption>
            )
          })} 
        </MenuOptions>
      </Menu>
    )
  }
}
