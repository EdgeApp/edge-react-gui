// @flow

import { asNumber, asObject } from 'cleaners'
import { Disklet } from 'disklet'
import { ImageSourcePropType, Platform } from 'react-native'
import RNFS from 'react-native-fs'

const directory = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalCachesDirectoryPath

const THEME_CACHE_FILE_NAME = 'themeCache.json'
const EDGE_CONTENT_SERVER = 'https://content.edge.app'

const asThemeCache = asObject(asNumber)

type ItemTimestamps = { start: number, expiration: number }

type ThemeCache = {
  [name: string]: { cachedTimestamp: number }
}

const getThemeCache = async (disklet: Disklet): ThemeCache => asThemeCache(JSON.parse(await disklet.getText(THEME_CACHE_FILE_NAME)))

const setThemeCache = async (disklet: Disklet, data: ThemeCache): Promise<void> => await disklet.setText(THEME_CACHE_FILE_NAME, JSON.stringify(data))

const getThemeItemTimestamps = async (url: string): Promise<ItemTimestamps> => {
  const response = await fetch(url, { method: 'HEAD' })
  const start = response.headers.get('x-amz-meta-start-date') // '2021-08-26T01:37:50Z'
  const expiration = response.headers.get('x-amz-meta-expiration-date') // '2021-08-29T01:37:50Z'
  if (start == null || expiration == null) throw new Error('Failed to find file on CDN')
  return { start: Date.parse(start), expiration: Date.parse(expiration) }
}

export async function getBackgroundImageFromCDN(disklet: Disklet): Promise<ImageSourcePropType> {
  const BACKGROUND_IMAGE_FILE_NAME = 'login_bg.gif'
  const BACKGROUND_IMAGE_URL = `${EDGE_CONTENT_SERVER}/${BACKGROUND_IMAGE_FILE_NAME}`
  const BACKGROUND_IMAGE_LOCAL_URI = `file://${directory}/${BACKGROUND_IMAGE_FILE_NAME}`
  const now = Date.now()

  let cache = {}
  try {
    cache = await getThemeCache(disklet)
  } catch (e) {
    // Failure is OK
  }
  if (cache[BACKGROUND_IMAGE_URL] == null) {
    cache[BACKGROUND_IMAGE_URL] = { cachedTimestamp: now }
  }

  try {
    const timestamps = await getThemeItemTimestamps(BACKGROUND_IMAGE_URL)
    if (now > timestamps.start && now < timestamps.expiration) {
      if (
        cache[BACKGROUND_IMAGE_URL].cachedTimestamp > timestamps.start &&
        cache[BACKGROUND_IMAGE_URL].cachedTimestamp < timestamps.expiration &&
        (await RNFS.exists(BACKGROUND_IMAGE_LOCAL_URI))
      ) {
        return { uri: BACKGROUND_IMAGE_LOCAL_URI }
      }

      await RNFS.downloadFile({ fromUrl: BACKGROUND_IMAGE_URL, toFile: BACKGROUND_IMAGE_LOCAL_URI })
      cache[BACKGROUND_IMAGE_URL].cachedTimestamp = now
      await setThemeCache(disklet, cache)
      return { uri: BACKGROUND_IMAGE_LOCAL_URI }
    } else {
      throw new Error('CDN file expired.')
    }
  } catch (e) {
    console.warn(`Error accessing CDN at ${BACKGROUND_IMAGE_URL} or local cache`)
    throw e
  }
}
