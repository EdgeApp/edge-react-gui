import * as React from 'react'
import { Linking, Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { getLocaleOrDefaultString } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { infoServerData } from './network'

const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.split('-')[0].split('.').map(Number)
  const v2Parts = v2.split('-')[0].split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1
    if (v1Parts[i] < v2Parts[i]) return -1
  }
  return 0
}

export const checkAppVersion = async (): Promise<void> => {
  const currentVersion = getVersion()
  const platform = Platform.OS

  // Get latest version from info server
  const updateInfo = infoServerData.rollup?.updateInfo
  if (updateInfo == null || updateInfo[platform] == null) return
  const { updateVersion, localeMessage } = updateInfo[platform]

  const message = getLocaleOrDefaultString(localeMessage)

  // Compare versions
  if (compareVersions(updateVersion, currentVersion) > 0) {
    // Show update modal
    const updateRes = await Airship.show<'update' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.update_available}
        message={message}
        buttons={{
          update: {
            label: lstrings.update_now,
            type: 'primary'
          }
        }}
      />
    ))
    if (updateRes === 'update') {
      const url = Platform.OS === 'android' ? config.playStore : config.appStore
      await Linking.openURL(url)
    }
  }
}
