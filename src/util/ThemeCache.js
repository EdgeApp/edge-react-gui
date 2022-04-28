// @flow

import { asDate, asMap, asObject, uncleaner } from 'cleaners'
import { Disklet } from 'disklet'
import { ImageSourcePropType } from 'react-native'
import RNFS from 'react-native-fs'

import { BACKGROUND_IMAGE_FILE_NAME, BACKGROUND_IMAGE_LOCAL_URI } from '../constants/CdnConstants'
import { config } from '../theme/appConfig.js'
import { pickRandom } from './utils.js'

const THEME_CACHE_FILE_NAME = 'themeCache.json'

const asThemeCache = asObject({
  assets: asMap(
    asObject({
      start: asDate,
      expiration: asDate
    })
  )
})
const wasThemeCache = uncleaner(asThemeCache)
type ThemeCache = $Call<typeof asThemeCache>

type ItemTimestamps = { start: Date, expiration: Date }

async function getThemeCache(disklet: Disklet): Promise<ThemeCache> {
  const data = await disklet.getText(THEME_CACHE_FILE_NAME)
  return asThemeCache(JSON.parse(data))
}

async function setThemeCache(disklet: Disklet, data: ThemeCache): Promise<void> {
  const text = JSON.stringify(wasThemeCache(data))
  await disklet.setText(THEME_CACHE_FILE_NAME, text)
}

const getThemeItemTimestamps = async (url: string): Promise<ItemTimestamps> => {
  const response = await fetch(url, { method: 'HEAD' })
  const start = response.headers.get('x-amz-meta-start-date') // '2021-08-26T01:37:50Z'
  const expiration = response.headers.get('x-amz-meta-expiration-date') // '2021-08-29T01:37:50Z'
  if (start == null || expiration == null) throw new Error('Failed to find file on CDN')
  return { start: new Date(start), expiration: new Date(expiration) }
}

const downloadFile = async (disklet: Disklet, fromUrl: string, toFile: string): Promise<void> => {
  // See if the server even has an image for us in the first place:
  const cache: ThemeCache = await getThemeCache(disklet).catch(() => ({ assets: {} }))
  const { start, expiration } = await getThemeItemTimestamps(fromUrl)
  if (expiration.valueOf() < Date.now()) {
    delete cache.assets[fromUrl]
    await setThemeCache(disklet, cache)
    return
  }
  const cacheTimes = cache.assets[fromUrl]
  if (cacheTimes != null && cacheTimes.start.valueOf() === start.valueOf() && cacheTimes.expiration.valueOf() === expiration.valueOf()) return

  // Download file whenever local file timestamps do not equal remote file timestamps
  const download = RNFS.downloadFile({ fromUrl, toFile })
  const status = await download.promise
  if (status.statusCode !== 200) throw new Error('Failed to download')
  cache.assets[fromUrl] = { start, expiration }
  await setThemeCache(disklet, cache)
}

export async function getBackgroundImage(disklet: Disklet): Promise<ImageSourcePropType | null> {
  const now = Date.now()

  const backgroundImageServer = pickRandom(config.backgroundImageServers)
  if (backgroundImageServer == null) return null

  const backgroundImageUrl = `${backgroundImageServer}/${BACKGROUND_IMAGE_FILE_NAME}`

  console.log(`backgroundImageUrl:${backgroundImageUrl}`)
  const cache: ThemeCache = await getThemeCache(disklet).catch(() => ({ assets: {} }))
  const cacheTimes = cache.assets[backgroundImageUrl]
  // Always return existing local file but query and download new remote file in the background
  downloadFile(disklet, backgroundImageUrl, BACKGROUND_IMAGE_LOCAL_URI).catch(() => {
    console.warn(`Error downloading ${BACKGROUND_IMAGE_LOCAL_URI}`)
  })
  if (cacheTimes != null && cacheTimes.start.valueOf() < now && cacheTimes.expiration.valueOf() > now && (await RNFS.exists(BACKGROUND_IMAGE_LOCAL_URI))) {
    return { uri: BACKGROUND_IMAGE_LOCAL_URI }
  } else {
    return null
  }
}
