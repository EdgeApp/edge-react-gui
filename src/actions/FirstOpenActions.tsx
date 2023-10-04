import { asNumber, asObject, asString, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import { FIRST_OPEN } from '../constants/constantSettings'
import { makeUuid } from '../util/utils'

const firstOpenDisklet = makeReactNativeDisklet()

const asFirstOpenInfo = asObject({
  isFirstOpen: asValue('true', 'false'),
  deviceId: asString,
  firstOpenEpoch: asNumber
})
type FirstOpenInfo = ReturnType<typeof asFirstOpenInfo>

let firstOpenInfo: FirstOpenInfo

/**
 * Returns whether this session was the first time the user opened the app.
 * Repeated calls will return the same result. Also sets the deviceId &
 * firstOpenEpoch
 */
export const getFirstOpenInfo = async (): Promise<FirstOpenInfo> => {
  if (firstOpenInfo == null) {
    let firstOpenText
    try {
      firstOpenText = await firstOpenDisklet.getText(FIRST_OPEN)
      firstOpenInfo = asFirstOpenInfo(JSON.parse(firstOpenText))
    } catch (error: any) {
      // Generate new values.
      firstOpenInfo = {
        deviceId: makeUuid(),
        firstOpenEpoch: Date.now(),
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
