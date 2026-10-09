import * as React from 'react'
import { Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'

import { useSelector } from '../types/reactRedux'
import { filterInfoCards } from '../util/infoUtils'
import { infoServerData } from '../util/network'
import { getOsVersion } from '../util/rnUtils'

/**
 * Ramp provider ids that the account's affiliation prefers for this direction,
 * highest priority first.
 *
 * The configuration is the existing `promoCards2` info server data: any card
 * that survives `filterInfoCards` for this account contributes its
 * `pluginPromotions[].preferProviders`. Reading the ungated `filterInfoCards`
 * rather than `getDisplayInfoCards` is deliberate — the display path drops
 * cards with empty `localeMessages`, so a card with `localeMessages: {}` and no
 * `ctaButton` configures provider priority silently, without ever rendering in
 * the promo carousel.
 *
 * `filterInfoCards` already enforces the affiliate match (`promoId` against
 * `installerId` / `activePromotions`) and the start/end dates, so an expired
 * card stops applying with no app update. The date is captured when the scene
 * mounts, so an expiry that passes mid-session takes effect on the next mount.
 *
 * `pluginIds` is not consulted: it names legacy GUI plugin ids (`amountquote`),
 * which have no meaning in the ramps flow. Ramps match on `pluginType` alone.
 */
export const useRampPreferredProviders = (
  direction: 'buy' | 'sell'
): string[] => {
  const accountReferral = useSelector(state => state.account.accountReferral)
  const countryCode = useSelector(state => state.ui.settings.countryCode)

  // `infoServerData.rollup` is a module-level object the info server fills in
  // asynchronously and replaces on each refresh, so the card array is part of
  // the memo key. Without it, a scene that mounts before the first fetch lands
  // would hold an empty preference list for the rest of its life.
  const promoCards = infoServerData.rollup?.promoCards2

  return React.useMemo(() => {
    const { activePromotions, installerId } = accountReferral

    const cards = filterInfoCards({
      buildNumber: getBuildNumber(),
      cards: promoCards ?? [],
      countryCode,
      currentDate: new Date(),
      installerId,
      osType: Platform.OS,
      osVersion: getOsVersion(),
      promoIds: activePromotions,
      version: getVersion()
    })

    const preferredProviders: string[] = []
    for (const card of cards) {
      for (const pluginPromotion of card.pluginPromotions ?? []) {
        if (pluginPromotion.pluginType !== direction) continue
        for (const providerId of pluginPromotion.preferProviders ?? []) {
          if (!preferredProviders.includes(providerId)) {
            preferredProviders.push(providerId)
          }
        }
      }
    }
    return preferredProviders
  }, [accountReferral, countryCode, direction, promoCards])
}
