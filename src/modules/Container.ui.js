import React, { Component } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, Content, StyleProvider } from 'native-base'
import getTheme from '../../native-base-theme/components'
import platform from '../../native-base-theme/variables/platform'

import SideMenu from './SideMenu/SideMenu.ui'
import Header from './Header/Header.ui'
import TabBar from './TabBar/TabBar.ui'
import Transactions from './Transactions/Transactions.ui'
import Directory from './Directory/Directory.ui'
import Request from './Request/index'
import SendConfirmation from './SendConfirmation/index'
import Scan from './Scan/Scan.ui'
import WalletList from './WalletList/WalletList.ui'

import { makeContext } from 'airbitz-core-js'
import { makeReactNativeIo } from 'react-native-airbitz-io'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { MenuContext } from 'react-native-menu'
import { addWallet, selectWallet } from './Wallets/Wallets.action.js'
import { initializeAccount } from './Container.middleware'
import {enableLoadingScreenVisibility} from './Container.action'

import AddWallet from './AddWallet/index.js'

import FakeAccount from '../Fakes/FakeAccount.js'

import { TxLibBTC, abcTxEngine } from 'airbitz-txlib-shitcoin'

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    this.props.dispatch(enableLoadingScreenVisibility())
    console.log(TxLibBTC.getInfo())
    //console.log(TxLibBTC.makeEngine())
  }

  componentDidMount () {
    console.log('about to initializeAccount')
    initializeAccount(this.props.dispatch)
  }

  render () {
    if (this.props.loadingScreenVisible) {
      console.log('logging in...')
      return (
        <ActivityIndicator
          animating={this.props.loadingScreenVisible}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          size='large'
        />
      )
    }

    console.log('logged in')
    console.log('loading the app...')
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{ flex: 1 }}>
          <Container>
            <SideMenu>
              <Header />
              <RouterWithRedux>
                <Scene key='root' hideNavBar>

                  <Scene key='scan' component={Scan} title='Scan' duration={0} />

                  <Scene key='walletList' component={WalletList} title='Wallets' duration={0} initial />

                  <Scene key='directory' component={Directory} title='Directory' duration={0} />

                  <Scene key='transactions' component={Transactions} title='Transactions' duration={0} initial />

                  <Scene key='request' component={Request} title='Request' duration={0} />

                  <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' duration={0} />

                  <Scene key='addWallet' component={AddWallet} title='Add Wallet' duration={0} />
                  
                </Scene>
              </RouterWithRedux>
            </SideMenu>
            <TabBar />
          </Container>
        </MenuContext>
      </StyleProvider>
    )
  }

}

export default connect( state => ({
  loadingScreenVisible: state.ui.main.loadingScreenVisible
}) )(Main)