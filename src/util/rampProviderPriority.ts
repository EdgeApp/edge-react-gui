import type { RampProviderPriority } from 'edge-info-server'

export interface RampProviderPriorityProps {
  /** Promotion ids the account has picked up, from `accountReferral`. */
  activePromotions?: string[]
  /** The account's country setting, or `undefined` before it is known. */
  countryCode?: string
  /** The instant to evaluate date scoping against. */
  currentDate: Date
  /** The affiliate the account installed from, from `accountReferral`. */
  installerId?: string
  /** The `rampProviderPriority` document for this app, from the info rollup. */
  priority?: RampProviderPriority
}

/**
 * Promotion ids in the `rampProviderPriority` document that apply to this
 * account right now, in document key order.
 *
 * A `promoId` key applies when it matches the account's `installerId` OR
 * appears in its active promotions. These are alternatives, not a conjunction:
 * a user who installed from one source and later picked up the promotion by
 * link still gets the boost.
 *
 * The scoping fields narrow it further. An entry's country list is matched
 * case-insensitively against the account's country, and a country-scoped entry
 * is dropped while the country is unknown. An unparseable date is treated as an
 * unset bound rather than as an instant, since `new Date('garbage').valueOf()`
 * is NaN and every comparison against it is false.
 */
export const getRampPriorityPromoIds = (
  props: RampProviderPriorityProps
): string[] => {
  const { activePromotions, countryCode, currentDate, installerId, priority } =
    props
  if (priority == null) return []

  const lowerCountryCode = countryCode?.toLowerCase()
  const promoIds: string[] = []

  for (const [promoId, rule] of Object.entries(priority)) {
    if (
      installerId !== promoId &&
      !(activePromotions ?? []).some(activePromoId => activePromoId === promoId)
    ) {
      continue
    }

    const {
      countryCodes = [],
      excludeCountryCodes = [],
      endIsoDate,
      startIsoDate
    } = rule

    if (countryCodes.length > 0 || excludeCountryCodes.length > 0) {
      if (lowerCountryCode == null) continue
      const isIncluded =
        countryCodes.length === 0 ||
        countryCodes.some(code => code.toLowerCase() === lowerCountryCode)
      const isExcluded = excludeCountryCodes.some(
        code => code.toLowerCase() === lowerCountryCode
      )
      if (!isIncluded || isExcluded) continue
    }

    const startDate = parseIsoDate(startIsoDate)
    if (startDate != null && currentDate.valueOf() < startDate) continue
    const endDate = parseIsoDate(endIsoDate)
    if (endDate != null && currentDate.valueOf() > endDate) continue

    promoIds.push(promoId)
  }

  return promoIds
}

/**
 * Ramp provider ids the account's affiliation prefers for this direction,
 * highest priority first.
 *
 * Every entry that applies contributes, in document key order and
 * deduplicated, so an account holding two promotions gets both preferences
 * with the first-listed one winning ties.
 */
export const getRampPreferredProviders = (
  props: RampProviderPriorityProps & { direction: 'buy' | 'sell' }
): string[] => {
  const { direction, priority } = props
  if (priority == null) return []

  const preferredProviders: string[] = []
  for (const promoId of getRampPriorityPromoIds(props)) {
    for (const providerId of priority[promoId][direction] ?? []) {
      if (!preferredProviders.includes(providerId)) {
        preferredProviders.push(providerId)
      }
    }
  }

  return preferredProviders
}

const parseIsoDate = (isoDate?: string): number | undefined => {
  if (isoDate == null) return undefined
  const time = new Date(isoDate).valueOf()
  return isNaN(time) ? undefined : time
}
