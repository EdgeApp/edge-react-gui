import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { Footer, FooterTab, Button, Icon, Text } from 'native-base'

import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

class TabBar extends Component {

  _handleToggleSideBar = () => {
    if(!this.props.sidemenu) {
      this.props.dispatch(openSidebar())
    }
    if(this.props.sidemenu) {
      this.props.dispatch(closeSidebar())
    }
  }

  render () {
    return (
        <Footer>
          <FooterTab>
            <Button onPress={ () => Actions.directory() }>
              <Icon name='home' />
              <Text>Directory</Text>
            </Button>
            <Button>
              <Icon name='download' />
              <Text>Request</Text>
            </Button>
            <Button>
              <Icon name='arrow-round-up' />
              <Text>Scan</Text>
            </Button>
            <Button onPress={ () => Actions.transactions() }>
              <Icon name='swap' />
              <Text>Transactions</Text>
            </Button>
            <Button onPress={ this._handleToggleSideBar } active={ this.props.sidemenu ? true : false }>
              <Icon name='menu' />
              <Text>More</Text>
            </Button>
          </FooterTab>
        </Footer>
    )
  }

}

export default connect( state => ({

  sidemenu : state.sidemenu.view

}) )(TabBar)
