import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native';
import { Icon, Title } from 'native-base';
import { Actions } from 'react-native-router-flux'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu';

export default class Body extends Component {

  render () {
    switch(this.props.routes.scene.sceneKey) {
      default:
        return <MainHeader  routes={this.props.routes}/>
    }
  }

}

class MainHeader extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return (
      <Menu onSelect={(value) => alert(`User selected the number ${value}`)}>
        <MenuTrigger>
          <Text style={{ fontSize: 20, color: "#FFF" }}>Transactions</Text>
        </MenuTrigger>
        <MenuOptions>
          <MenuOption value={1}>
            <Text>One</Text>
          </MenuOption>
          <MenuOption value={2}>
            <Text>Two</Text>
          </MenuOption>
          <MenuOption value={3}>
            <Text>Three</Text>
          </MenuOption>
          <MenuOption value={4}>
            <Text>Four</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

}
