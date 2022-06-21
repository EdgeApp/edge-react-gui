// @flow

import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'
import { getLocales } from 'react-native-localize'

import { config } from '../theme/appConfig.js'
import { useEffect, useRef } from '../types/reactHooks.js'
import { useSelector } from '../types/reactRedux.js'

export type Profile = {
  appId: string | void,
  appVersion: string,
  language: string,
  location: string,
  platform: 'ios' | 'android'
}

// Hook to get the current user profile
export const useProfile = () => {
  const { languageTag, countryCode } = getLocales()[0]
  const platform = Platform.OS
  const appVersion = getVersion() // When developing, it would default to be: 99.99.99
  const appId = config.appId ?? 'edge'

  const location = useSelector(state => state.ui.settings.countryCode ?? countryCode)

  const profile = useRef({
    appId,
    appVersion,
    language: languageTag,
    location,
    platform
  })

  useEffect(() => {
    if (location !== profile.current.location) {
      profile.current = { ...profile.current, location }
    }
  }, [location])

  return profile.current
}
