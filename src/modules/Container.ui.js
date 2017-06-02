import React, { Component } from 'react'
import { View, ActivityIndicator, StatusBar } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, StyleProvider } from 'native-base'
import { MenuContext } from 'react-native-menu'

import getTheme from '../theme/components'
import platform from '../theme/variables/platform'

import TransactionList from './UI/scenes/TransactionList'
import Directory from './UI/scenes/Directory/Directory.ui'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/Scan.ui'
import WalletList from './UI/scenes/WalletList/WalletList.ui'
import AddWallet from './UI/scenes/AddWallet/index.js'

import SideMenu from './UI/components/SideMenu/SideMenu.ui'
import Header from './UI/components/Header/Header.ui'
import TabBar from './UI/components/TabBar/TabBar.ui'
import HelpModal from './UI/components/HelpModal'
import TransactionAlert from './UI/components/TransactionAlert'

import { initializeAccount } from './middleware'
import { enableLoadingScreenVisibility } from './action'

import styles from './style.js'

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    initializeAccount(this.props.dispatch)
    this.props.dispatch(enableLoadingScreenVisibility())
  }

  componentWillMount () {
    console.log('about to initializeAccount')
  }

  render () {
    if (this.props.loadingScreenVisible) {
      console.log('Logging in...')
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
    console.log('Logged in')
    console.log('Loading the app...')
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{ flex: 1 }}>
          <View style={styles.statusBarHack}>
            <Container>
              <StatusBar backgroundColor='green' barStyle='light-content' />
              <SideMenu>
                <Header />
                <RouterWithRedux>
                  <Scene key='root' hideNavBar>

                    <Scene key='scan' component={Scan} title='Scan' duration={0} />

                    <Scene key='walletList' component={WalletList} title='Wallets' duration={0} initial />

                    <Scene key='directory' component={Directory} title='Directory' duration={0} />

                    <Scene key='transactionList' component={TransactionList} title='Transactions' duration={0} />

                    <Scene key='request' component={Request} title='Request' duration={0} />

                    <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' duration={0} />

                    <Scene key='addWallet' component={AddWallet} title='Add Wallet' duration={0} />

                  </Scene>
                </RouterWithRedux>
                <HelpModal />
                <TransactionAlert />
              </SideMenu>
              <TabBar />
            </Container>
          </View>
        </MenuContext>
      </StyleProvider>
    )
  }

}

export default connect(state => ({
  loadingScreenVisible: state.ui.main.loadingScreenVisible
}))(Main)
