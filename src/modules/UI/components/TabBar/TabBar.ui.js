import React, {Component} from 'react'
import {Image} from 'react-native'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import {Footer, FooterTab, Button} from 'native-base'
import LinearGradient from 'react-native-linear-gradient'
import {setTabBarHeight} from '../../dimensions/action'
import {openSidebar, closeSidebar} from '../SideMenu/action'
import T from '../FormattedText'
import wallet from '../../../../assets/images/tabbar/wallets.png'
import walletSelected from '../../../../assets/images/tabbar/wallets_selected.png'
import receive from '../../../../assets/images/tabbar/receive.png'
import receiveSelected from '../../../../assets/images/tabbar/receive_selected.png'
import scan from '../../../../assets/images/tabbar/scan.png'
import scanSelected from '../../../../assets/images/tabbar/scan_selected.png'
import exchange from '../../../../assets/images/tabbar/exchange.png'
import exchangeSelected from '../../../../assets/images/tabbar/exchange_selected.png'
import more from '../../../../assets/images/tabbar/more.png'
import moreSelected from '../../../../assets/images/tabbar/more_selected.png'
import styles from './styles.js'

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
    let {x, y, width, height} = event.nativeEvent.layout
    console.log('TabBar event.nativeEvent is : ', event.nativeEvent)
    console.log('TabBar onLayout occurred', x, y, width, height)
    this.props.dispatch(setTabBarHeight(height))
  }

  render () {
    return (
      <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3b7adb', '#2b569a']} style={{borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'solid'}} onLayout={this._onLayout} >
        <Footer>
          <FooterTab>

            <Button
              onPress={Actions.walletList}
              // onPress={() => Actions.login()}
              active={this.props.routes.scene.name === 'walletList'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'walletList' ? walletSelected : wallet}
              />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'walletList' && styles.activeButton]}>{sprintf(strings.enUS['drawer_wallets'])}</T>
            </Button>

            <Button
              onPress={Actions.request}
              active={this.props.routes.scene.name === 'request'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'request' ? receiveSelected : receive}
              />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'request' && styles.activeButton]}>{sprintf(strings.enUS['drawer_request'])}</T>
            </Button>

            <Button
              onPress={Actions.scan}
              active={this.props.routes.scene.name === 'scan'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'scan' ? scanSelected : scan}
              />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'scan' && styles.activeButton]}>{sprintf(strings.enUS['drawer_scan'])}</T>
            </Button>

            <Button
              onPress={Actions.transactionList}
              active={this.props.routes.scene.name === 'transactionList'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'transactionList' ? exchangeSelected : exchange}
              />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'transactionList' && styles.activeButton]}>{sprintf(strings.enUS['drawer_transactions'])}</T>
            </Button>

            <Button
              onPress={this._handleToggleSideBar}
              active={this.props.sidemenu}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.sidemenu ? moreSelected : more}
              />
              <T style={[{marginTop: 5}, styles.buttonText]}>{sprintf(strings.enUS['drawer_more'])}</T>
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
