import * as React from 'react'

import { useSelector } from '../types/reactRedux'
import { infoServerData } from '../util/network'
import { getRampPreferredProviders } from '../util/rampProviderPriority'

/**
 * Ramp provider ids that the account's affiliation prefers for this direction,
 * highest priority first.
 *
 * The configuration is the info server's `rampProviderPriority` document, which
 * carries provider ordering and nothing else. It replaced a read of
 * `promoCards2.pluginPromotions`, where ordering rode on a display card that
 * had to be hidden behind empty copy to stay out of the promo carousel.
 *
 * Matching, date scoping and country scoping live in
 * `getRampPreferredProviders`. The date is captured when the scene mounts, so
 * an expiry that passes mid-session takes effect on the next mount.
 */
export const useRampPreferredProviders = (
  direction: 'buy' | 'sell'
): string[] => {
  const accountReferral = useSelector(state => state.account.accountReferral)
  const countryCode = useSelector(state => state.ui.settings.countryCode)

  // `infoServerData.rollup` is a module-level object the info server fills in
  // asynchronously and replaces on each refresh, so the document is part of the
  // memo key. Without it, a scene that mounts before the first fetch lands
  // would hold an empty preference list for the rest of its life.
  const priority = infoServerData.rollup?.rampProviderPriority

  return React.useMemo(() => {
    const { activePromotions, installerId } = accountReferral

    return getRampPreferredProviders({
      activePromotions,
      countryCode,
      currentDate: new Date(),
      direction,
      installerId,
      priority
    })
  }, [accountReferral, countryCode, direction, priority])
}
