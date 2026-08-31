import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network'

/**
 * Connectivity helpers via expo-network.
 * @react-native-community/netinfo stays linked for any remaining consumers.
 */

export interface ConnectionState {
  isConnected: boolean
}

const toConnectionState = (isConnected?: boolean | null): ConnectionState => ({
  isConnected: isConnected ?? false
})

export const fetchConnectionState = async (): Promise<ConnectionState> => {
  const state = await getNetworkStateAsync()
  return toConnectionState(state.isConnected)
}

export const addConnectionListener = (
  listener: (state: ConnectionState) => void
): (() => void) => {
  const subscription = addNetworkStateListener(state => {
    listener(toConnectionState(state.isConnected))
  })
  return () => {
    subscription.remove()
  }
}
