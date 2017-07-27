import React, { Component } from 'react'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { Footer, FooterTab, Button, Text } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

import { setTabBarHeight } from '../../dimensions/action'
import { openSidebar, closeSidebar } from '../SideMenu/action'

import wallet from '../../../../assets/images/tabbar/wallets@3x.png.png'
import walletSelected from '../../../../assets/images/tabbar/wallets_selected@3x.png.png'
import receive from '../../../../assets/images/tabbar/receive@3x.png.png'
import receiveSelected from '../../../../assets/images/tabbar/receive_selected@3x.png.png'
import scan from '../../../../assets/images/tabbar/scan@3x.png.png'
import scanSelected from '../../../../assets/images/tabbar/scan_selected@3x.png.png'
import exchange from '../../../../assets/images/tabbar/exchange@3x.png.png'
import exchangeSelected from '../../../../assets/images/tabbar/exchange_selected@3x.png.png'
import more from '../../../../assets/images/tabbar/more@3x.png.png'
import moreSelected from '../../../../assets/images/tabbar/more_selected@3x.png.png'

class TabBar extends Component {

  _handleToggleSideBar = () => {
    if (!this.props.sidemenu) {
      this.props.dispatch(openSidebar())
    }
    if (this.props.sidemenu) {
      this.props.dispatch(closeSidebar())
    }
  }

  _onLayout = (event) => {
    var {x, y, width, height} = event.nativeEvent.layout
    console.log('TabBar event.nativeEvent is : ', event.nativeEvent)
    console.log('TabBar onLayout occurred', x, y, width, height)
    this.props.dispatch(setTabBarHeight(height))
  }

  render () {
    return (
      <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3b7adb', '#2b569a']} style={{ borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'solid' }} onLayout={this._onLayout} >
        <Footer>
          <FooterTab>

            <Button
              onPress={() => Actions.walletList()}
              active={this.props.routes.scene.name === 'walletList'}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name === 'walletList' ? walletSelected : wallet}
              />
              <Text style={{ marginTop: 5 }}>Wallets</Text>
            </Button>

            <Button
              onPress={() => Actions.request()}
              active={this.props.routes.scene.name === 'request'}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name === 'request' ? receiveSelected : receive}
              />
              <Text style={{ marginTop: 5 }}>Request</Text>
            </Button>

            <Button
              onPress={() => Actions.scan()}
              active={this.props.routes.scene.name === 'scan'}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name === 'scan' ? scanSelected : scan}
              />
              <Text style={{ marginTop: 5 }}>Scan</Text>
            </Button>

            <Button
              onPress={() => Actions.transactionList({type: 'reset'})}
              active={this.props.routes.scene.name === 'transactionList'}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.routes.scene.name === 'transactionList' ? exchangeSelected : exchange}
              />
              <Text style={{ marginTop: 5 }}>Transactions</Text>
            </Button>

            <Button
              onPress={this._handleToggleSideBar}
              active={this.props.sidemenu}
            >
              <Image
                style={{width: 25, height: 25}}
                source={this.props.sidemenu ? moreSelected : more}
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
  routes: state.routes
})

export default connect(mapStateToProps)(TabBar)
