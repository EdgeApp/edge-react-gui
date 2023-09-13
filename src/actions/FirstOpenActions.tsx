import { makeReactNativeDisklet } from 'disklet'

import { FIRST_OPEN } from '../constants/constantSettings'

const firstOpenDisklet = makeReactNativeDisklet()

let isFirstOpen: boolean | undefined

/**
 * Returns whether this session was the first time the user opened the app.
 * Repeated calls will return the same result.
 */
export const getIsFirstOpen = async () => {
  if (isFirstOpen != null) return isFirstOpen
  else {
    try {
      await firstOpenDisklet.getText(FIRST_OPEN)
      isFirstOpen = false
    } catch (error: any) {
      await firstOpenDisklet.setText(FIRST_OPEN, '')
      isFirstOpen = true
    }
    return isFirstOpen
  }
}
