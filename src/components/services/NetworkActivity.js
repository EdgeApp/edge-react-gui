// @flow

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import * as React from 'react'
import { connect } from 'react-redux'

import s from '../../locales/strings'
import { type Dispatch } from '../../types/reduxTypes.js'
import { showError } from './AirshipInstance'

type Props = {
  changeConnectivity: (isConnected: boolean) => void
}

class NetworkActivityComponent extends React.Component<Props> {
  netInfoUnsubscribe: void | (() => void)

  handleNetworkState = (info: NetInfoState) => {
    console.log('NetworkActivity - isConnected changed: ', info.isConnected)
    this.props.changeConnectivity(info.isConnected)
    if (!info.isConnected) {
      showError(`${s.strings.network_alert_title}`)
    }
  }

  componentDidMount() {
    this.netInfoUnsubscribe = NetInfo.addEventListener(this.handleNetworkState)
    NetInfo.fetch().then(this.handleNetworkState)
  }

  componentWillUnmount() {
    if (this.netInfoUnsubscribe != null) this.netInfoUnsubscribe()
  }

  render() {
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
