// @flow

import { Component } from 'react'
import { AppState } from 'react-native'

type AppStateType = 'active' | 'background' | 'inactive'
type State = {
  timestamp: Date,
  appState: AppStateType
}
type Props = {
  autoLogoutTimeInSeconds: ?number,
  autoLogout: () => void,
  loginStatus: boolean
}
export default class AutoLogout extends Component<Props, State> {
  state = {
    timestamp: new Date(),
    appState: 'active'
  }

  UNSAFE_componentWillMount () {
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
      this.props.autoLogout()
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
