import React, {Component} from 'react'
import {AppState, View} from 'react-native'
import {DefaultRenderer} from 'react-native-router-flux'
import {connect} from 'react-redux'

import {logoutRequest} from '../../components/ControlPanel/action'

import SideMenu from '../../components/SideMenu/SideMenu.ui'
import Header from '../../components/Header/Header.ui'
import TabBar from '../../components/TabBar/TabBar.ui'
import HelpModal from '../../components/HelpModal'
import ABAlert from '../../components/ABAlert'
import TransactionAlert from '../../components/TransactionAlert'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'

class Layout extends Component {
  constructor (props) {
    super(props)
    this.state = {
      active: true,
      timeout: ''
    }
  }

  componentDidMount () {
    console.log('layout constructor')
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this._handleAppStateChange)
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
        <ABAlert style={{flex: 1}} />
        <TransactionAlert style={{flex: 1}} />
        <TabBar style={{flex: 1}} />
      </View>
    )
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.foregrounded(nextAppState)) {
      console.log('Background -> Foreground')
      this.setState({active: true})

      this.cancelAutoLogoutTimer()
    }

    if (this.backgrounded(nextAppState)) {
      console.log('Foreground -> Background')
      this.setState({active: false})

      this.beginAutoLogoutTimer()
    }
  }

  foregrounded (nextAppState) {
    return !this.state.active && nextAppState === 'active'
  }

  backgrounded (nextAppState) {
    return this.state.active && nextAppState !== 'active'
  }

  beginAutoLogoutTimer () {
    const timeout = setTimeout(() => this.autoLogout(), (this.props.autoLogoutTimeInSeconds * 1000))
    this.setState({timeout})
  }

  cancelAutoLogoutTimer () {
    const {timeout} = this.state
    clearTimeout(timeout)
  }

  autoLogout () {
    console.log('TIMEOUT')
    this.props.logout()
  }
}

const mapStateToProps = (state) => ({
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})
const mapDispatchToProps = dispatch => ({
  logout: () => dispatch(logoutRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
