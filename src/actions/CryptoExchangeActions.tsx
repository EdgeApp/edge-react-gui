import { Alert } from 'react-native'

import {} from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'

export function checkEnabledExchanges(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    // make sure exchanges are enabled
    let isAnyExchangeEnabled = false
    const exchanges = account.swapConfig
    if (exchanges == null) return
    for (const exchange of Object.keys(exchanges)) {
      if (exchanges[exchange].enabled) {
        isAnyExchangeEnabled = true
      }
    }

    if (!isAnyExchangeEnabled) {
      Alert.alert(lstrings.no_exchanges_available, lstrings.check_exchange_settings)
    }
  }
}
