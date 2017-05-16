import React, { Component } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, Content, StyleProvider } from 'native-base'
import Menu, { MenuContext } from 'react-native-menu';
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'
import SideMenu from './UI/components/SideMenu/SideMenu.ui'
import Header from './UI/components/Header/Header.ui'
import TabBar from './UI/components/TabBar/TabBar.ui'
import TransactionsList from './UI/scenes/TransactionsList'
import Directory from './UI/scenes/Directory/Directory.ui'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/Scan.ui'
import WalletList from './UI/scenes/WalletList/WalletList.ui'
import HelpModal from './UI/components/HelpModal'
import TransactionAlert from './UI/components/TransactionAlert'

import { makeContext } from 'airbitz-core-js'
import { makeReactNativeIo } from 'react-native-airbitz-io'
import { addAccountToRedux, addAirbitzToRedux } from './Login/action.js'


import { initializeAccount } from './middleware'
import {enableLoadingScreenVisibility} from './action'

import { addWallet, selectWallet } from './UI/Wallets/action.js'

import AddWallet from './UI/scenes/AddWallet/index.js'

import FakeAccount from '../Fakes/FakeAccount.js'

import { TxLibBTC, abcTxEngine } from 'airbitz-txlib-shitcoin'

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    this.props.dispatch(enableLoadingScreenVisibility())
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

                  <Scene key='transactions' component={TransactionsList} title='Transactions' duration={0} initial />

                  <Scene key='request' component={Request} title='Request' duration={0} />

                  <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' duration={0} />

                  <Scene key='addWallet' component={AddWallet} title='Add Wallet' duration={0} />

                </Scene>
              </RouterWithRedux>
              <HelpModal/>
              <TransactionAlert/>
            </SideMenu>
            <TabBar />
          </Container>
        </MenuContext>
      </StyleProvider>
    )
  }

}

export default connect(state => ({
  loadingScreenVisible: state.ui.main.loadingScreenVisible
}))(Main)
