import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { Footer, FooterTab, Button, Icon, Text } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

import { setTabBarHeight } from '../../dimensions/action'
import { openSidebar, closeSidebar } from '../SideMenu/action'

class TabBar extends Component {

  _handleToggleSideBar = () => {
    if(!this.props.sidemenu) {
      this.props.dispatch(openSidebar())
    }
    if(this.props.sidemenu) {
      this.props.dispatch(closeSidebar())
    }
  }

  _onLayout = (event) => {
    var {x, y, width, height} = event.nativeEvent.layout
    console.log('TabBar event.nativeEvent is : ', event.nativeEvent)
    console.log('TabBar onLayout occurred', x , y , width , height)
    this.props.dispatch(setTabBarHeight(height))
  }  

  render () {
    return (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]} style={{ borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'solid' }} onLayout={this._onLayout} >
        <Footer>
          <FooterTab>

            <Button
              onPress={ () => Actions.walletList() }
              active={ this.props.routes.scene.title  === 'Directory' ? true : false }
            >
              <Icon name='ios-cash-outline' />
              <Text>Wallets</Text>
            </Button>

            <Button
              onPress={ () => Actions.request() }
              active={ this.props.routes.scene.title  === 'Request' ? true : false }
            >
              <Icon name='download' />
              <Text>Request</Text>
            </Button>

            <Button
              onPress={ () => Actions.scan() }
              active={ this.props.routes.scene.title  === 'Scan' ? true : false }
            >
              <Icon name='share' />
              <Text>Scan</Text>
            </Button>

            <Button
              onPress={ () => Actions.transactionList() }
                active={ this.props.routes.scene.title  === 'Transactions' ? true : false }
              >
                <Icon name='swap' />
                <Text>Transactions</Text>
              </Button>

              <Button
                onPress={ this._handleToggleSideBar }
                active={ this.props.sidemenu ? true : false }
              >
                <Icon name='more' />
                <Text>More</Text>
              </Button>

            </FooterTab>
        </Footer>
      </LinearGradient>
    )
  }
}

const mapStateToProps = state => ({
  sidemenu: state.ui.scenes.sideMenu.view,
  routes:   state.routes
})

export default connect(mapStateToProps)(TabBar)
