import { Dispatch, GetState } from '../types/reduxTypes'
import { getCountryCodeByIp } from './AccountReferralActions'

/**
 * Fetches the country code based on IP address and stores it in Redux
 */
export const fetchCountryCode =
  () =>
  async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    try {
      const countryCode = await getCountryCodeByIp()

      dispatch({
        type: 'UI/SET_COUNTRY_CODE',
        data: { countryCode }
      })
    } catch (error) {
      console.warn(`fetchCountryCode failed: ${String(error)}`)
    }
  }
