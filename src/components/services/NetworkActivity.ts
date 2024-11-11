import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { useDispatch } from '../../types/reactRedux'
import { showError } from './AirshipInstance'

export function NetworkActivity(props: {}): null {
  const dispatch = useDispatch()

  React.useEffect(() => {
    const handleNetworkState = (info: NetInfoState) => {
      console.log('NetworkActivity - isConnected changed: ', info.isConnected)
      dispatch({
        type: 'NETWORK/NETWORK_STATUS',
        data: { isConnected: info.isConnected ?? false }
      })
      if (!info.isConnected) {
        showError(`${lstrings.network_alert_title}`, { trackError: false })
      }
    }

    const netInfoUnsubscribe = NetInfo.addEventListener(handleNetworkState)
    NetInfo.fetch()
      .then(handleNetworkState)
      .catch(err => showError(err))

    return () => netInfoUnsubscribe()
  }, [dispatch])

  return null
}
