import { asDate } from 'cleaners'
import { InfoCard } from 'edge-info-server'
import shajs from 'sha.js'

import { AccountReferral } from '../types/ReferralTypes'

export interface FilteredInfoCard {
  background: InfoCard['background']
  ctaButton: InfoCard['ctaButton']
  dismissable: InfoCard['dismissable']
  localeMessages: InfoCard['localeMessages']
  pluginPromotions: InfoCard['pluginPromotions']
  messageId: string
}

/**
 * Finds the info server cards that are relevant to our application version &
 * other factors.
 */
export function filterInfoCards(params: {
  cards: InfoCard[]
  countryCode?: string
  buildNumber: string
  osType: string
  version: string
  osVersion: string
  currentDate: Date
  accountFunded?: boolean
  accountReferral?: Partial<AccountReferral>
}): FilteredInfoCard[] {
  const { cards, countryCode, accountFunded, buildNumber, osType, version, osVersion, currentDate, accountReferral } = params

  let accountPromoIds: string[] | undefined
  if (accountReferral != null) {
    const accountReferralId = accountReferral?.installerId == null ? [] : [accountReferral.installerId]
    const promotions = accountReferral.promotions ?? []
    accountPromoIds = [...promotions.map(promotion => promotion.installerId), ...accountReferralId]
  }

  // Find relevant cards:
  const ccLowerCase = countryCode?.toLowerCase()
  const filteredCards: FilteredInfoCard[] = []
  for (const card of cards) {
    const {
      appVersion,
      background,
      countryCodes = [],
      ctaButton,
      dismissable = false,
      endIsoDate,
      exactBuildNum,
      excludeCountryCodes = [],
      localeMessages,
      maxBuildNum,
      minBuildNum,
      noBalance = false,
      osTypes = [],
      osVersions = [],
      startIsoDate,
      pluginPromotions,
      promoId
    } = card

    const startDate = asDate(startIsoDate ?? '1970-01-01')
    const endDate = asDate(endIsoDate ?? '1970-01-01')

    // Validate balance status. If the card specifies 'noBalance' and
    // accountFunded balances are not ready yet (undefined), omit until balances
    // are ready and we re-run.
    if (noBalance) {
      if (accountFunded == null || accountFunded) continue
    }

    // Validate app version
    // Ignore everything else if build version is specified and mismatched.
    if (exactBuildNum != null && exactBuildNum !== buildNumber) continue

    // Ignore min/max if app version is specified and mismatched.
    if (appVersion != null && appVersion !== version) continue

    // Look at min/max only if exact build or app version is not specified.
    if (minBuildNum != null && minBuildNum > buildNumber) continue
    if (maxBuildNum != null && maxBuildNum < buildNumber) continue

    // Validate country
    if (excludeCountryCodes.length > 0 || countryCodes.length > 0) {
      if (ccLowerCase == null) continue
      const isCountryInclude = countryCodes.length === 0 || countryCodes.map(cc => cc.toLowerCase()).includes(ccLowerCase)
      const isCountryExclude = excludeCountryCodes.length > 0 && excludeCountryCodes.map(cc => cc.toLowerCase()).includes(ccLowerCase)
      if (!isCountryInclude || isCountryExclude) continue
    }

    // Validate OS type
    if (osTypes.length > 0 && !osTypes.map(osType => osType).includes(osType)) continue

    // Validate OS version
    if (osVersions.length > 0 && !osVersions.includes(osVersion)) continue

    // Validate date range
    if (startIsoDate != null && currentDate.valueOf() < startDate.valueOf()) continue
    if (endIsoDate != null && currentDate.valueOf() > endDate.valueOf()) continue

    // Validate promoId
    if (promoId != null && (accountPromoIds == null || !accountPromoIds.some(accountPromoId => accountPromoId === promoId))) continue

    const messageId = shajs('sha256')
      .update(localeMessages.en_US ?? JSON.stringify(card), 'utf8')
      .digest('base64')

    filteredCards.push({
      background,
      ctaButton,
      dismissable,
      localeMessages,
      pluginPromotions,
      messageId
    })
  }

  return filteredCards
}
