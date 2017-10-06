import React, {Component} from 'react'
import {Image} from 'react-native'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {Actions} from 'react-native-router-flux'
import {Footer, FooterTab, Button} from 'native-base'
import Gradient from '../Gradient/Gradient.ui'
import {openSideMenu, closeSideMenu} from '../SideMenu/action'
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

export default class TabBar extends Component {

  _handleToggleSideMenu = () => {
    if (!this.props.sidemenu) {
      this.props.dispatch(openSideMenu())
    }
    if (this.props.sidemenu) {
      this.props.dispatch(closeSideMenu())
    }
  }

  render () {
    return (
      <Gradient style={{borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'solid'}}>
        <Footer>
          <FooterTab>

            <Button
              onPress={Actions.walletList}
              active={this.props.routes.scene.name === 'walletList'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'walletList' ? walletSelected : wallet} />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'walletList' && styles.activeButton]}>
                {sprintf(strings.enUS['drawer_wallets'])}
              </T>
            </Button>

            <Button
              onPress={Actions.request}
              active={this.props.routes.scene.name === 'request'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'request' ? receiveSelected : receive} />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'request' && styles.activeButton]}>
                {sprintf(strings.enUS['drawer_request'])}
              </T>
            </Button>

            <Button
              onPress={Actions.scan}
              active={this.props.routes.scene.name === 'scan'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'scan' ? scanSelected : scan} />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'scan' && styles.activeButton]}>
                {sprintf(strings.enUS['drawer_scan'])}
              </T>
            </Button>

            <Button
              onPress={Actions.transactionList}
              active={this.props.routes.scene.name === 'transactionList'}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.routes.scene.name === 'transactionList' ? exchangeSelected : exchange} />
              <T style={[{marginTop: 3}, styles.buttonText, this.props.routes.scene.name === 'transactionList' && styles.activeButton]}>
                {sprintf(strings.enUS['drawer_transactions'])}
              </T>
            </Button>

            <Button
              onPress={this._handleToggleSideMenu}
              active={this.props.sidemenu}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.sidemenu ? moreSelected : more} />
              <T style={[{marginTop: 5}, styles.buttonText]}>
                {sprintf(strings.enUS['drawer_more'])}
              </T>
            </Button>

          </FooterTab>
        </Footer>
      </Gradient>
    )
  }
}
