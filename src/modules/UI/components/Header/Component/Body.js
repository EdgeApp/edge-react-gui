import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon, Title } from 'native-base';
import { Actions } from 'react-native-router-flux'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu';

export default class Body extends Component {

  render () {
    switch(this.props.routes.scene.sceneKey) {
      case 'scan':
        return <ExampleMyWallet />
      case 'request':
        return <ExampleMyWallet />
      case 'transactions':
        return <ExampleToWallet />
      default:
        return <DefaultHeader routes={this.props.routes} />
    }
  }

}

class DefaultHeader extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return <Title>{ this._renderTitle() }</Title>
  }

}

class ExampleMyWallet extends Component {

  render () {
    return (
      <Menu onSelect={(value) => alert(`User selected your ${value}`)}>
        <MenuTrigger>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>My Wallet  </Text>
            <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
          </View>
        </MenuTrigger>
        <MenuOptions>
          <MenuOption value='My First Wallet'>
            <Text>Wallet 1 - jsdkaj</Text>
          </MenuOption>
          <MenuOption value='My Second Wallet'>
            <Text>Wallet 2 - e13j29djak</Text>
          </MenuOption>
          <MenuOption value='My Third Wallet'>
            <Text>Wallet 3 - 9i349jd</Text>
          </MenuOption>
          <MenuOption value='My Fourth Wallet'>
            <Text>Wallet 4 - ajdliewr</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

}

class ExampleToWallet extends Component {

  render () {
    return (
      <Menu onSelect={(value) => alert(`User selected ${value} to transfer to`)}>
        <MenuTrigger>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#FFF", fontSize: 20 }}>To Wallet  </Text>
            <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25 }} />
          </View>
        </MenuTrigger>
        <MenuOptions>
          <MenuOption value='jsdkaj'>
            <Text>Transfer Wallet 1</Text>
          </MenuOption>
          <MenuOption value='asjdakl'>
            <Text>Transfer Wallet 2</Text>
          </MenuOption>
          <MenuOption value='pipoipqwe'>
            <Text>Transfer Wallet 3</Text>
          </MenuOption>
          <MenuOption value='lklnmmh'>
            <Text>Transfer Wallet 4</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

}
