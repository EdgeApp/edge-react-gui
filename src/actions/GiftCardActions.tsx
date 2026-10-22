import { showToast } from '../components/services/AirshipInstance'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { lstrings } from '../locales/strings'
import { hasPhazeGiftCardOrders } from '../plugins/gift-cards/phazeGiftCardOrderStore'
import type { ThunkAction } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import { getPhazeConfig } from '../util/phazeConfig'
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
  | 'unavailable'

interface GiftCardDestinationParams {
  disablePlugins: NestedDisableMap
  hasPhazeApiKey: boolean
  /** The account has saved gift card orders, so it has purchase history. */
  hasPhazeOrders: boolean
}

/**
 * Picks which gift card destination the Spend entry points open.
 *
 * Phaze backs every gift card scene, so when it is unavailable (no API key, or
 * remotely disabled through the info server) Bitrefill is the whole offering and
 * the purchase scenes are skipped entirely. The one exception is an account
 * holding Phaze orders while Phaze is remotely disabled: its vouchers are only
 * reachable through the list scene, which runs read-only in that state.
 */
export const pickGiftCardDestination = (
  params: GiftCardDestinationParams
): GiftCardDestination => {
  const { disablePlugins, hasPhazeApiKey, hasPhazeOrders } = params

  if (!hasPhazeApiKey) return pickPurchaseDestination(disablePlugins)

  if (isGiftCardProviderDisabled(disablePlugins, PHAZE_PLUGIN_ID)) {
    return hasPhazeOrders
      ? 'giftCardList'
      : pickPurchaseDestination(disablePlugins)
  }

  return hasPhazeOrders ? 'giftCardList' : 'giftCardMarket'
}

/**
 * Picks where a purchase goes while Phaze is unavailable. Bitrefill can be
 * remotely disabled too, and with both providers off there is nothing to open,
 * so the entry points report that instead of navigating.
 */
export const pickPurchaseDestination = (
  disablePlugins: NestedDisableMap
): 'bitrefill' | 'unavailable' =>
  isGiftCardProviderDisabled(disablePlugins, BITREFILL_PLUGIN_ID)
    ? 'unavailable'
    : 'bitrefill'

/**
 * Navigates to the appropriate gift card destination after ensuring a country is
 * selected. Shows a country selection modal if needed.
 *
 * @returns true if navigation occurred, false if nothing is available or the
 * user cancelled country selection
 */
export const navigateToGiftCards =
  (navigation: NavigationBase): ThunkAction<Promise<boolean>> =>
  async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { disablePlugins } = state.ui.giftCardInfo
    let { countryCode } = state.ui.settings

    const destination = pickGiftCardDestination({
      disablePlugins,
      hasPhazeApiKey: getPhazeConfig()?.apiKey != null,
      hasPhazeOrders: await hasPhazeGiftCardOrders(account)
    })

    // Neither provider is available, so there is no scene worth opening:
    if (destination === 'unavailable') {
      showToast(lstrings.gift_card_providers_unavailable)
      return false
    }

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
