// @flow
import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { type Theme } from '../types/Theme'

// TODO: Add other CDN references to the theme files to allow third-party config:
// flags, currency icons, partners, etc

export const EDGE_CONTENT_SERVER_URL = 'https://content.edge.app'

export const FLAG_LOGO_URL = `${EDGE_CONTENT_SERVER_URL}/country-logos`

const directory = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalCachesDirectoryPath
const BACKGROUND_IMAGE_FILE_NAME = 'login_bg.gif'
export const BACKGROUND_IMAGE_URI = `${EDGE_CONTENT_SERVER_URL}/${BACKGROUND_IMAGE_FILE_NAME}`
export const BACKGROUND_IMAGE_LOCAL_URI = `file://${directory}/${BACKGROUND_IMAGE_FILE_NAME}`

export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.exchangeLogoBaseUrl}/${pluginId}.png`
}

export function getPartnerIconUri(partnerIconPath: string) {
  return `${EDGE_CONTENT_SERVER_URL}/${partnerIconPath}`
}
