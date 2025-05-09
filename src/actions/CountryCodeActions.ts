import { FIRST_OPEN } from '../constants/constantSettings'
import { Dispatch, GetState } from '../types/reduxTypes'
import { getCountryCodeByIp } from './AccountReferralActions'
import { firstOpenDisklet, getFirstOpenInfo } from './FirstOpenActions'

/**
 * Fetches the country code based on IP address and stores it in Redux
 * Falls back to the stored value in firstOpenInfo if the IP check fails
 */
export const fetchCountryCode =
  () =>
  async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    try {
      // Load the code from disk first
      const firstOpenInfo = await getFirstOpenInfo()

      // Also check the IP address with fallback to stored country code
      const countryCode = await getCountryCodeByIp().catch(() => {
        return firstOpenInfo.countryCode
      })

      // Update disk if the location differs from before and the ip check was
      // successful
      if (countryCode !== firstOpenInfo.countryCode && countryCode != null) {
        firstOpenInfo.countryCode = countryCode
        await firstOpenDisklet.setText(FIRST_OPEN, JSON.stringify(firstOpenInfo))
      }

      // Update Redux with the fresh country code
      if (countryCode != null) {
        dispatch({
          type: 'UI/SET_COUNTRY_CODE',
          data: { countryCode }
        })
      }
    } catch (error) {
      console.warn(`fetchCountryCode failed: ${String(error)}`)
    }
  }
