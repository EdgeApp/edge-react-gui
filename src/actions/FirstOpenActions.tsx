import { asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import { FIRST_OPEN } from '../constants/constantSettings'
import { makeUuid } from '../util/rnUtils'
import { getCountryCodeByIp } from './AccountReferralActions'

export const firstOpenDisklet = makeReactNativeDisklet()

const asFirstOpenInfo = asObject({
  isFirstOpen: asValue('true', 'false'),
  deviceId: asString,
  firstOpenEpoch: asNumber,
  countryCode: asOptional(asString)
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
    } catch (error: unknown) {
      // Generate new values.
      firstOpenInfo = {
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
