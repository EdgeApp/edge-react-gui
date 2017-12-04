// @flow

import React, {Component} from 'react'
import {Image} from 'react-native'
import {Actions} from 'react-native-router-flux'
import {Footer, FooterTab, Button} from 'native-base'

import type {Dispatch} from '../../../ReduxTypes'

import strings from '../../../../locales/default'
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

const WALLETS_TEXT      = strings.enUS['drawer_wallets']
const REQUEST_TEXT      = strings.enUS['drawer_request']
const SCAN_TEXT         = strings.enUS['drawer_scan']
const TRANSACTIONS_TEXT = strings.enUS['drawer_transactions']
const MORE_TEXT         = strings.enUS['drawer_more']

type State = {}
type Props = {
  dispatch: Dispatch,
  routes: any
}

export default class TabBar extends Component<Props, State> {
  handleToggleSideMenu = () => {
    if (!this.props.sidemenu) {
      this.props.dispatch(openSideMenu())
    }
    if (this.props.sidemenu) {
      this.props.dispatch(closeSideMenu())
    }
  }

  isActive = (sceneKey: string) => this.props.routes.scene.children[0].sceneKey === sceneKey

  render () {
    return (
        <Footer>
          <FooterTab>

            <Button
              onPress={Actions.walletList}
              active={this.isActive('walletList')}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.isActive('walletList') ? walletSelected : wallet} />
              <T style={[
                {marginTop: 3},
                styles.buttonText,
                this.isActive('walletList') && styles.activeButton
              ]}>
                {WALLETS_TEXT}
              </T>
            </Button>

            <Button
              onPress={Actions.request}
              active={this.isActive('request')}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.isActive('request') ? receiveSelected : receive} />
              <T style={[
                {marginTop: 3},
                styles.buttonText,
                this.isActive('request') && styles.activeButton
              ]}>
                {REQUEST_TEXT}
              </T>
            </Button>

            <Button
              onPress={Actions.scan}
              active={this.isActive('scan')}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.isActive('scan') ? scanSelected : scan} />
              <T style={[
                {marginTop: 3},
                styles.buttonText,
                this.isActive('scan') && styles.activeButton
              ]}>
                {SCAN_TEXT}
              </T>
            </Button>

            <Button
              onPress={Actions.transactionList}
              active={this.isActive('transactionList')}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.isActive('transactionList') ? exchangeSelected : exchange} />
              <T style={[
                {marginTop: 3},
                styles.buttonText,
                this.isActive('transactionList') && styles.activeButton
              ]}>
                {TRANSACTIONS_TEXT}
              </T>
            </Button>

            <Button
              onPress={this.handleToggleSideMenu}
              active={this.props.sidemenu}>
              <Image
                style={[{width: 25, height: 25, marginTop: 3}]}
                source={this.props.sidemenu ? moreSelected : more} />
              <T style={[{marginTop: 5}, styles.buttonText]}>
                {MORE_TEXT}
              </T>
            </Button>

          </FooterTab>
        </Footer>
    )
  }
}
