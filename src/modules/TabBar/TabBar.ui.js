import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { Footer, FooterTab, Button, Icon, Text } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

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
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]}>
        <Footer>
            <FooterTab>

              <Button onPress={ () => Actions.directory() }>
                <Icon name='home' />
                <Text>Directory</Text>
              </Button>

              <Button onPress={ () => Actions.request() }>
                <Icon name='download' />
                <Text>Request</Text>
              </Button>

              <Button onPress={ () => Actions.scan() }>
                <Icon name='share' />
                <Text>Scan</Text>
              </Button>

              <Button onPress={ () => Actions.transactions() }>
                <Icon name='swap' />
                <Text>Transactions</Text>
              </Button>

              <Button onPress={ () => Actions.sendConfirmation() }>
                <Icon name='swap' />
                <Text>SendC</Text>
              </Button>

              <Button onPress={ this._handleToggleSideBar }
                active={ this.props.sidemenu ? true : false }>
                <Icon name='more' />
                <Text>More</Text>
              </Button>

            </FooterTab>
        </Footer>
      </LinearGradient>
    )
  }

}

export default connect( state => ({

  sidemenu : state.sidemenu.view

}) )(TabBar)
