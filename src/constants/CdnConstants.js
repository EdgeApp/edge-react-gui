// @flow
import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

export const EDGE_CONTENT_SERVER_URI = 'https://content.edge.app'

export const FLAG_LOGO_URL = `${EDGE_CONTENT_SERVER_URI}/country-logos`

const directory = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalCachesDirectoryPath
const BACKGROUND_IMAGE_FILE_NAME = 'login_bg.gif'
export const BACKGROUND_IMAGE_URI = `${EDGE_CONTENT_SERVER_URI}/${BACKGROUND_IMAGE_FILE_NAME}`
export const BACKGROUND_IMAGE_LOCAL_URI = `file://${directory}/${BACKGROUND_IMAGE_FILE_NAME}`
