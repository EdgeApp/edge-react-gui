import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { useDispatch } from '../../types/reactRedux'
import {
  addConnectionListener,
  fetchConnectionState
} from '../../util/connection'
import { showError } from './AirshipInstance'

interface Props {}

export function NetworkActivity(props: Props): null {
  const dispatch = useDispatch()

  React.useEffect(() => {
    const handleNetworkState = (info: { isConnected: boolean }): void => {
      console.log('NetworkActivity - isConnected changed: ', info.isConnected)
      dispatch({
        type: 'NETWORK/NETWORK_STATUS',
        data: { isConnected: info.isConnected }
      })
      if (!info.isConnected) {
        showError(lstrings.network_alert_title, { trackError: false })
      }
    }

    const unsubscribe = addConnectionListener(handleNetworkState)
    fetchConnectionState()
      .then(handleNetworkState)
      .catch((err: unknown) => {
        showError(err)
      })

    return () => {
      unsubscribe()
    }
  }, [dispatch])

  return null
}
