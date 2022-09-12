import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import * as React from 'react'

import s from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { showError } from './AirshipInstance'

type DispatchProps = {
  changeConnectivity: (isConnected: boolean) => void
}
type Props = DispatchProps

class NetworkActivityComponent extends React.Component<Props> {
  netInfoUnsubscribe: undefined | (() => void)

  handleNetworkState = (info: NetInfoState) => {
    console.log('NetworkActivity - isConnected changed: ', info.isConnected)
    this.props.changeConnectivity(info.isConnected ?? false)
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

export const NetworkActivity = connect<{}, DispatchProps, {}>(
  state => ({}),
  dispatch => ({
    changeConnectivity(isConnected: boolean) {
      dispatch({
        type: 'NETWORK/NETWORK_STATUS',
        data: { isConnected }
      })
    }
  })
)(NetworkActivityComponent)
