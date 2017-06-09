import React, { Component } from 'react'
import { View, ActivityIndicator, StatusBar } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, StyleProvider } from 'native-base'
import { MenuContext } from 'react-native-menu'
import LinearGradient from 'react-native-linear-gradient'

import getTheme from '../theme/components'
import platform from '../theme/variables/platform'

import TransactionListConnect from './UI/scenes/TransactionList'
import Directory from './UI/scenes/Directory/Directory.ui'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/Scan.ui'
import WalletList from './UI/scenes/WalletList/WalletList.ui'
import AddWallet from './UI/scenes/AddWallet/index.js'
import * as Settings from './UI/scenes/Settings'

import Login from './UI/scenes/Login/index.js'

import SideMenu from './UI/components/SideMenu/SideMenu.ui'
import Header from './UI/components/Header/Header.ui'
import TabBar from './UI/components/TabBar/TabBar.ui'
import HelpModal from './UI/components/HelpModal'
import TransactionAlert from './UI/components/TransactionAlert'

import { initializeAccount, addAirbitzToRedux, addWalletByKey } from './Login/action.js'
import { updateExchangeRates } from './UI/components/ExchangeRate/action'
import { selectWalletById } from './UI/Wallets/action.js'
import { setDeviceDimensions } from './UI/dimensions/action'

import { makeReactNativeIo } from 'react-native-airbitz-io'
import { makeContext } from 'airbitz-core-js'

import styles from './style.js'

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    console.log('main constructor props', props)

    this.state = {
      loading: true,
      loginVisible: true,
      context: {}
    }
  }

  componentDidMount = () => {
    makeReactNativeIo()
    .then(io => {
      const context = makeContext({
        apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
        io
      })

      this.props.dispatch(addAirbitzToRedux(context))
      this.setState({
        context,
        loading: false
      })
    })
    this.props.dispatch(updateExchangeRates()) // this is dummy data and this function will need to be moved         
  }
  _onLayout = (event) => {
    var {x, y, width, height} = event.nativeEvent.layout
    let xScale = (width / 375).toFixed(2)
    let yScale = (height / 647).toFixed(2)
    this.props.dispatch(setDeviceDimensions({width, height, xScale, yScale}))  
  }

  render () {
    if (this.state.loading) {
      return (
        <LinearGradient
          style={styles.background}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          colors={['#3b7adb', '#2b569a']}>
        </LinearGradient>
      )
    }

    if (this.state.loginVisible) {
      return (
        <Login
          callbacks={makeAccountCallbacks(this.props.dispatch)}
          context={this.state.context}
          onLoggedIn={account => {
            this.props.dispatch(initializeAccount(account))
            this.setState({ loginVisible: false })
          }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )
    }

    return (
      <StyleProvider style={getTheme(platform)}>

        <MenuContext style={{ flex: 1 }}>

          <View style={styles.statusBarHack}>

            <Container onLayout={this._onLayout}>

              <StatusBar backgroundColor='green' barStyle='light-content' />
              <SideMenu>
                <Header />

                <RouterWithRedux>

                  <Scene key='root' hideNavBar>

                    <Scene key='scan' component={Scan} title='Scan' duration={0} test={console.log('this.props', this.props)}/>

                    <Scene key='walletList' component={WalletList} title='Wallets' duration={0} initial />

                    <Scene key='directory' component={Directory} title='Directory' duration={0} />

                    <Scene key='transactionList' component={TransactionListConnect} title='Transactions' duration={0} />

                    <Scene key='request' component={Request} title='Request' duration={0} />

                    <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' duration={0} />

                    <Scene key='addWallet' component={AddWallet} title='Add Wallet' duration={0} />

                    <Scene key='settingsOverview' component={Settings.SettingsOverview} title='Settings' duration={0} />

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

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})

export default connect()(Main)

const makeAccountCallbacks = dispatch => {
  const callbacks = {
    onDataChanged: () => {
      console.log('onDataChanged')
    },

    onKeyListChanged: () => {
      console.log('onKeyListChanged')
    },

    onLoggedOut: () => {
      console.log('onLoggedOut')
    },

    onOTPRequired: () => {
      console.log('onOTPRequired')
    },

    onOTPSkew: () => {
      console.log('onOTPSkew')
    },

    onRemotePasswordChanged: () => {
      console.log('onRemotePasswordChanged')
    }
  }

  return callbacks
}
