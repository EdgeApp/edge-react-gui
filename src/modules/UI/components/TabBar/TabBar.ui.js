import React, { Component } from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { Footer, FooterTab, Button, Icon, Text } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

import { setTabBarHeight } from '../../dimensions/action'
import { openSidebar, closeSidebar } from '../SideMenu/action'

import wallet from '../../../../assets/images/tabbar/wallets.png'
import wallet_selected from '../../../../assets/images/tabbar/wallets_selected.png'
import receive from '../../../../assets/images/tabbar/receive.png'
import receive_selected from '../../../../assets/images/tabbar/receive_selected.png'
import scan from '../../../../assets/images/tabbar/scan.png'
import scan_selected from '../../../../assets/images/tabbar/scan_selected.png'
import exchange from '../../../../assets/images/tabbar/exchange.png'
import exchange_selected from '../../../../assets/images/tabbar/exchange_selected.png'
import more from '../../../../assets/images/tabbar/more.png'
import more_selected from '../../../../assets/images/tabbar/more_selected.png'

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
              active={ this.props.routes.scene.name  === 'walletList' ? true : false }
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name  === 'walletList' ? wallet_selected : wallet}
              />
              <Text style={{ marginTop: 5 }}>Wallets</Text>
            </Button>

            <Button
              onPress={ () => Actions.request() }
              active={ this.props.routes.scene.name  === 'request' ? true : false }
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name  === 'request' ? receive_selected : receive}
              />
              <Text style={{ marginTop: 5 }}>Request</Text>
            </Button>

            <Button
              onPress={ () => Actions.scan() }
              active={this.props.routes.scene.name  === 'scan' ? true : false}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name  === 'scan' ? scan_selected : scan }
              />
              <Text style={{ marginTop: 5 }}>Scan</Text>
            </Button>

            <Button
              onPress={ () => Actions.transactionList({type: 'reset'}) }
              active={ this.props.routes.scene.name  === 'transactionList' ? true : false }
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name  === 'transactionList' ? exchange_selected : exchange}
              />
              <Text style={{ marginTop: 5 }}>Transactions</Text>
            </Button>

            <Button
              onPress={ this._handleToggleSideBar }
              active={ this.props.sidemenu ? true : false }
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.sidemenu ? more_selected : more}
              />
                <Text style={{ marginTop: 5 }}>More</Text>
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
