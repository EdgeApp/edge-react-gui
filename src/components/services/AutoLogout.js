// @flow

import { Component } from 'react'
import { AppState } from 'react-native'
import { connect } from 'react-redux'

import { logoutRequest } from '../../modules/Login/action.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'

type AppStateType = 'active' | 'background' | 'inactive'

type State = {
  timestamp: Date,
  appState: AppStateType
}

type Props = {
  autoLogoutTimeInSeconds: ?number,
  loginStatus: boolean,
  logout: () => void
}

class AutoLogoutComponent extends Component<Props, State> {
  state = {
    timestamp: new Date(),
    appState: 'active'
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  handleAppStateChange = (nextAppState: AppStateType) => {
    console.log(`APP STATE CHANGED ${this.state.appState} -> ${nextAppState}`)
    const newTimestamp = new Date()
    const oldTimeStamp = this.state.timestamp
    const durationInSeconds = this.props.autoLogoutTimeInSeconds || Infinity
    if (this.foregrounded(nextAppState) && this.props.loginStatus && this.isTimeExpired(durationInSeconds, newTimestamp, oldTimeStamp)) {
      this.props.logout()
    }

    this.setState(state => ({
      ...state,
      timestamp: newTimestamp,
      appState: nextAppState
    }))
  }

  foregrounded (nextAppState: AppStateType): boolean {
    return this.state.appState === 'background' && nextAppState === 'active'
  }

  backgrounded (nextAppState: AppStateType): boolean {
    return this.state.appState === 'background' && nextAppState !== 'active'
  }

  isTimeExpired (durationInSeconds: number, newTimestamp: Date, oldTimeStamp: Date): boolean {
    const differenceInMilliseconds: number = newTimestamp - oldTimeStamp
    const differenceInSeconds: number = differenceInMilliseconds / 1000
    return differenceInSeconds > durationInSeconds
  }

  render () {
    return null
  }
}

export const AutoLogout = connect(
  (state: ReduxState) => ({
    loginStatus: state.ui.settings.loginStatus,
    autoLogoutTimeInSeconds: state.ui.settings.autoLogoutTimeInSeconds
  }),
  (dispatch: Dispatch) => ({
    logout () {
      return dispatch(logoutRequest())
    }
  })
)(AutoLogoutComponent)
