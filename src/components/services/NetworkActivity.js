// @flow

import NetInfo from '@react-native-community/netinfo'
import { Component } from 'react'
import { connect } from 'react-redux'

import s from '../../locales/strings'
import { type Dispatch } from '../../types/reduxTypes.js'
import { showError } from './AirshipInstance'

type Props = {
  changeConnectivity: (isConnected: boolean) => void
}

class NetworkActivityComponent extends Component<Props> {
  netInfoUnsubscribe: Function | null = null

  componentDidMount () {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      console.log(state.isConnected)
      this.props.changeConnectivity(state.isConnected)
      if (!state.isConnected) {
        showError(`${s.strings.network_alert_title}`)
      }
    })
  }

  componentWillUnmount () {
    this.netInfoUnsubscribe && this.netInfoUnsubscribe()
  }

  render () {
    return null
  }
}

export const NetworkActivity = connect(
  () => ({}),
  (dispatch: Dispatch) => ({
    changeConnectivity: (isConnected: boolean) => {
      return dispatch({
        type: 'NETWORK/NETWORK_STATUS',
        data: { isConnected }
      })
    }
  })
)(NetworkActivityComponent)
