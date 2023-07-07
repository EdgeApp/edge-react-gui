import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { showError } from './AirshipInstance'

interface DispatchProps {
  changeConnectivity: (isConnected: boolean) => void
}
type Props = DispatchProps

class NetworkActivityComponent extends React.Component<Props> {
  netInfoUnsubscribe: (() => void) | undefined

  handleNetworkState = (info: NetInfoState) => {
    console.log('NetworkActivity - isConnected changed: ', info.isConnected)
    this.props.changeConnectivity(info.isConnected ?? false)
    if (!info.isConnected) {
      showError(`${lstrings.network_alert_title}`, { trackError: false })
    }
  }

  componentDidMount() {
    this.netInfoUnsubscribe = NetInfo.addEventListener(this.handleNetworkState)
    NetInfo.fetch()
      .then(this.handleNetworkState)
      .catch(err => showError(err))
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
