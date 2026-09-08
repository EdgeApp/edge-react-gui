import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { ENV } from '../env'
import { hasStoredPhazeIdentity } from '../plugins/gift-cards/phazeGiftCardProvider'
import type { ThunkAction } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import { showCountrySelectionModal } from './CountryListActions'
import type { NestedDisableMap } from './ExchangeInfoActions'
import {
  BITREFILL_PLUGIN_ID,
  isGiftCardProviderDisabled,
  PHAZE_PLUGIN_ID
} from './GiftCardInfoActions'
import { readSyncedSettings } from './SettingsActions'

export type GiftCardDestination =
  | 'bitrefill'
  | 'giftCardList'
  | 'giftCardMarket'

interface GiftCardDestinationParams {
  disablePlugins: NestedDisableMap
  hasPhazeApiKey: boolean
  /** The account already holds Phaze identities, so it has purchase history. */
  hasPhazeOrders: boolean
}

/**
 * Picks which gift card destination the Spend entry points open.
 *
 * Phaze backs every gift card scene, so when it is unavailable — no API key, or
 * remotely disabled through the info server — Bitrefill is the whole offering
 * and the Phaze scenes are skipped entirely. That includes the list scene: it
 * polls the Phaze API every ten seconds, which is exactly the traffic a remote
 * disable exists to stop.
 */
export const pickGiftCardDestination = (
  params: GiftCardDestinationParams
): GiftCardDestination => {
  const { disablePlugins, hasPhazeApiKey, hasPhazeOrders } = params

  if (
    !hasPhazeApiKey ||
    isGiftCardProviderDisabled(disablePlugins, PHAZE_PLUGIN_ID)
  ) {
    // Bitrefill can be remotely disabled too. With both providers off there is
    // nothing to open, so the market scene shows its unavailable state.
    return isGiftCardProviderDisabled(disablePlugins, BITREFILL_PLUGIN_ID)
      ? 'giftCardMarket'
      : 'bitrefill'
  }

  return hasPhazeOrders ? 'giftCardList' : 'giftCardMarket'
}

/**
 * Navigates to the appropriate gift card destination after ensuring a country is
 * selected. Shows a country selection modal if needed.
 *
 * @returns true if navigation occurred, false if user cancelled country selection
 */
export const navigateToGiftCards =
  (navigation: NavigationBase): ThunkAction<Promise<boolean>> =>
  async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { disablePlugins } = state.ui.giftCardInfo
    let { countryCode } = state.ui.settings

    const hasPhazeApiKey = ENV.PLUGIN_API_KEYS?.phaze?.apiKey != null
    const destination = pickGiftCardDestination({
      disablePlugins,
      hasPhazeApiKey,
      hasPhazeOrders: hasPhazeApiKey && (await hasStoredPhazeIdentity(account))
    })

    // Going through the Phaze scenes to reach Bitrefill would register a Phaze
    // identity and fetch a catalog that is thrown away, which is what surfaced
    // an error to the user once the provider was remotely disabled.
    if (destination === 'bitrefill') {
      navigation.navigate('edgeAppStack', {
        screen: 'pluginView',
        params: { plugin: guiPlugins.bitrefill }
      })
      return true
    }

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

    navigation.navigate('edgeAppStack', { screen: destination })

    return true
  }
