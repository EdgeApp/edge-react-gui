// @flow
import React, {Component} from 'react'
import {AppState, View} from 'react-native'
import {DefaultRenderer} from 'react-native-router-flux'

import SideMenu from '../../components/SideMenu/SideMenuConnector'
import Header from '../../components/Header/HeaderConnector'
import TabBar from '../../components/TabBar/TabBarConnector'
import HelpModal from '../../components/HelpModal'
import ErrorAlert from '../../components/ErrorAlert/ErrorAlertConnector'

type Props = {
  navigationState: any,
  onNavigate: any,
  routes: any,
  autoLogoutTimeInSeconds: number,
  autoLogout: () => void,
  updateExchangeRates: () => void
}

type State = {
  active: boolean,
  timeout: ?number,
  exchangeTimer: ?number
}

export default class Layout extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      active: true,
      timeout: undefined,
      exchangeTimer: undefined
    }
  }

  componentDidMount () {
    // console.log('layout constructor')
    AppState.addEventListener('change', this._handleAppStateChange)
    const exchangeTimer = setInterval(() => {
      this.props.updateExchangeRates()
    }, 30000) // Dummy dispatch to allow scenes to update in mapStateToProps
    this.setState({exchangeTimer})
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this._handleAppStateChange)
    clearTimeout(this.state.exchangeTimer)
    this.setState({
      exchangeTimer: undefined
    })
  }

  render () {
    const state = this.props.navigationState
    const children = state.children

    return (
      <View style={{flex: 1}}>
        <Header routes={this.props.routes} />

        <SideMenu>
          <DefaultRenderer style={{flex: 1}} navigationState={children[0]} onNavigate={this.props.onNavigate} />
        </SideMenu>
        <HelpModal style={{flex: 1}} />
        <TabBar style={{flex: 1}} />
        <ErrorAlert />
      </View>
    )
  }

  _handleAppStateChange = (nextAppState: 'active' | 'background' | 'inactive') => {
    if (this.foregrounded(nextAppState)) {
      // console.log('Background -> Foreground')
      this.setState({active: true})

      this.cancelAutoLogoutTimer()
    }

    if (this.backgrounded(nextAppState)) {
      // console.log('Foreground -> Background')
      this.setState({active: false})

      if (this.props.autoLogoutTimeInSeconds) this.beginAutoLogoutTimer()
    }
  }

  foregrounded (nextAppState: 'active' | 'background' | 'inactive') {
    return !this.state.active && nextAppState === 'active'
  }

  backgrounded (nextAppState: 'active' | 'background' | 'inactive') {
    return this.state.active && nextAppState !== 'active'
  }

  beginAutoLogoutTimer () {
    const autoLogoutTimeInMilliseconds = (this.props.autoLogoutTimeInSeconds * 1000)
    const timeout = setTimeout(this.autoLogout, autoLogoutTimeInMilliseconds)
    this.setState({timeout})
  }

  cancelAutoLogoutTimer () {
    const {timeout} = this.state
    clearTimeout(timeout)
    this.setState({timeout: undefined})
  }

  autoLogout () {
    // console.log('TIMEOUT')
    this.props.autoLogout()
  }
}
