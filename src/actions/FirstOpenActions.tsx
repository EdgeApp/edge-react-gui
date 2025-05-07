import { getAttributionToken } from '@brigad/react-native-adservices'
import { asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { Platform } from 'react-native'

import { FIRST_OPEN } from '../constants/constantSettings'
import { makeUuid } from '../util/rnUtils'
import { snooze } from '../util/utils'
import { getCountryCodeByIp } from './AccountReferralActions'

export const firstOpenDisklet = makeReactNativeDisklet()

const asAppleAdsAttribution = asObject({
  campaignId: asOptional(asNumber),
  keywordId: asOptional(asNumber)
})
type AppleAdsAttribution = ReturnType<typeof asAppleAdsAttribution>

const asFirstOpenInfo = asObject({
  isFirstOpen: asValue('true', 'false'),
  deviceId: asString,
  firstOpenEpoch: asNumber,
  countryCode: asOptional(asString),
  appleAdsAttribution: asOptional(asAppleAdsAttribution)
})
type FirstOpenInfo = ReturnType<typeof asFirstOpenInfo>

let firstOpenInfo: FirstOpenInfo
let firstLoadPromise: Promise<FirstOpenInfo> | undefined

/**
 * Returns whether this session was the first time the user opened the app.
 * Repeated calls will return the same result. Initial disk read also sets the
 * deviceId & firstOpenEpoch if not already present.
 */
export const getFirstOpenInfo = async (): Promise<FirstOpenInfo> => {
  if (firstOpenInfo == null) {
    if (firstLoadPromise == null) firstLoadPromise = readFirstOpenInfoFromDisk()
    return await firstLoadPromise
  }
  return firstOpenInfo
}

/**
 * Reads firstOpenInfo from disk and sets the deviceId & firstOpenEpoch if not
 * already present.
 */
const readFirstOpenInfoFromDisk = async (): Promise<FirstOpenInfo> => {
  if (firstOpenInfo == null) {
    let firstOpenText
    try {
      firstOpenText = await firstOpenDisklet.getText(FIRST_OPEN)
      firstOpenInfo = asFirstOpenInfo(JSON.parse(firstOpenText))
      firstOpenInfo.isFirstOpen = 'false'
      firstOpenInfo.appleAdsAttribution = await getAppleAdsAttribution()
    } catch (error: unknown) {
      // Generate new values.
      firstOpenInfo = {
        appleAdsAttribution: await getAppleAdsAttribution(),
        deviceId: await makeUuid(),
        firstOpenEpoch: Date.now(),
        countryCode: await getCountryCodeByIp(),
        // If firstOpen != null: This is not the first time they opened the app,
        // but with an older version that didn't set a deviceId and firstOpen
        // date, just created an empty file.
        // Note that 'firstOpenEpoch' won't be accurate in this case, but at
        // least make a starting point.
        isFirstOpen: firstOpenText != null ? 'false' : 'true'
      }
      await firstOpenDisklet.setText(FIRST_OPEN, JSON.stringify(firstOpenInfo))
    }
  }

  return firstOpenInfo
}

/**
 * Get Apple Search Ads attribution data using the AdServices framework
 * and make an API call to get the actual keywordId.
 */
export async function getAppleAdsAttribution(): Promise<AppleAdsAttribution> {
  if (Platform.OS !== 'ios') {
    return { campaignId: undefined, keywordId: undefined }
  }

  // Get the attribution token from the device. This package also handles
  // checking for the required iOS version.
  const attributionToken = await getAttributionToken().catch(error => {
    console.log('Apple Ads attribution token unavailable:', error)
    return undefined
  })

  // Send the token to Apple's API to retrieve the campaign and keyword IDs.
  if (attributionToken != null) {
    // Retry logic as recommended by Apple:
    // "A 404 response can occur if you make an API call too quickly after
    // receiving a valid token. A best practice is to initiate retries at
    // intervals of 5 seconds, with a maximum of three attempts."
    // https://developer.apple.com/documentation/adservices/aaattribution/attributiontoken()#Attribution-payload
    const maxRetries = 3
    const retryDelay = 5000 // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get the attribution data from Apple for the token
        const response = await fetch('https://api-adservices.apple.com/api/v1/', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: attributionToken
        })

        // If we get a 404, wait and retry as per Apple's recommendation
        if (response.status === 404 && attempt < maxRetries) {
          console.log(`Apple Ads attribution API returned 404, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`)
          await snooze(5000)
          continue
        }

        if (!response.ok) throw new Error(`API call failed with status: ${response.status}`)

        const data = await response.json()
        console.log('Apple Ads attribution API response:', JSON.stringify(data))
        return asAppleAdsAttribution(data)
      } catch (apiError) {
        console.warn('Error fetching Apple Ads attribution data:', apiError)
        break
      }
    }
  }

  return { campaignId: undefined, keywordId: undefined }
}
