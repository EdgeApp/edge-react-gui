import { hasStoredPhazeIdentity } from '../plugins/gift-cards/phazeGiftCardProvider'
import type { ThunkAction } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import { showCountrySelectionModal } from './CountryListActions'
import { readSyncedSettings } from './SettingsActions'

/**
 * Navigates to the appropriate gift card scene (list or market) after ensuring
 * a country is selected. Shows a country selection modal if needed.
 *
 * @returns true if navigation occurred, false if user cancelled country selection
 */
export const navigateToGiftCards =
  (navigation: NavigationBase): ThunkAction<Promise<boolean>> =>
  async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    let { countryCode } = state.ui.settings

    // Ensure country is set before proceeding
    if (countryCode === '') {
      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: '',
          skipStateProvince: true
        })
      )
      // Re-read from synced settings to determine if user actually selected
      const synced = await readSyncedSettings(account)
      countryCode = synced.countryCode ?? ''
    }

    // User cancelled country selection
    if (countryCode === '') {
      return false
    }

    // Navigate to list if user has purchased before, otherwise market
    const hasIdentity = await hasStoredPhazeIdentity(account)
    navigation.navigate('edgeAppStack', {
      screen: hasIdentity ? 'giftCardList' : 'giftCardMarket'
    })

    return true
  }
