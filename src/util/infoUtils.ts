import { asDate } from 'cleaners'
import { InfoCard } from 'edge-info-server'
import { Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'

import { infoServerData } from './network'
import { getPromoCardMessageId } from './promoCardUtils'
import { getOsVersion } from './utils'

export interface DisplayInfoCard {
  background: InfoCard['background']
  ctaButton: InfoCard['ctaButton']
  dismissable: InfoCard['dismissable']
  localeMessages: InfoCard['localeMessages']
  pluginPromotions: InfoCard['pluginPromotions']
  messageId: string
}

interface InfoFilterProps {
  accountFunded?: boolean
  buildNumber: string
  cards: InfoCard[]
  countryCode?: string
  currentDate: Date
  installerId?: string
  osType: string
  osVersion: string
  promoIds?: Array<string | null>
  version: string
  /** If true, ignores the endIsoDate check (showing expired cards) */
  ignoreExpiration?: boolean
}

/**
 * Finds the info server data that is relevant to our application version &
 * other factors.
 *
 * `promoIds` and `installerId` are both used to check against `promoId` from
 * the info server data.
 */
export const filterInfoCards = (props: InfoFilterProps): InfoCard[] => {
  const { cards, countryCode, accountFunded, buildNumber, osType, version, osVersion, currentDate, promoIds, installerId } = props

  if (cards == null) return []

  // Find relevant cards:
  const ccLowerCase = countryCode?.toLowerCase()
  const filteredInfoData: InfoCard[] = []
  for (const card of cards) {
    const {
      appVersion,
      countryCodes = [],
      endIsoDate,
      exactBuildNum,
      excludeCountryCodes = [],
      maxBuildNum,
      minBuildNum,
      noBalance = false,
      osTypes = [],
      osVersions = [],
      startIsoDate,
      promoId
    } = card

    const startDate = asDate(startIsoDate ?? '1970-01-01')
    const endDate = asDate(endIsoDate ?? '1970-01-01')

    // Validate balance status. If the data specifies 'noBalance' and
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
    // Only check end date if we're not ignoring expiration
    if (!props.ignoreExpiration && endIsoDate != null && currentDate.valueOf() > endDate.valueOf()) continue

    // Validate promoId
    if (
      promoId != null &&
      ((promoIds != null && !promoIds.some(accountPromoId => accountPromoId === promoId)) || (installerId != null && installerId !== promoId))
    )
      continue

    filteredInfoData.push(card)
  }

  return filteredInfoData
}

/**
 * Similar to filterInfoCards, but returns only an array of `DisplayInfoCard`
 * display data.
 *
 * Ignores any info that doesn't contain display messages.
 */
export const getDisplayInfoCards = (props: InfoFilterProps): DisplayInfoCard[] => {
  const filteredInfoData = filterInfoCards(props)

  const filteredInfoCards: DisplayInfoCard[] = []
  for (const card of filteredInfoData) {
    const { background, ctaButton, dismissable, localeMessages, pluginPromotions } = card

    // Ignore any cards with no display data
    if (Object.keys(localeMessages).length === 0) continue

    const messageId = getPromoCardMessageId(localeMessages)
    filteredInfoCards.push({
      background,
      ctaButton,
      dismissable,
      localeMessages,
      pluginPromotions,
      messageId
    })
  }

  return filteredInfoCards
}

/**
 * Returns a list of promo IDs that are currently valid ("active") for the
 * environment and time according to info server `promoCards2` data.
 */
export const getActivePromoIds = async (props: { countryCode?: string; promoIds?: string[]; installerId?: string }): Promise<string[]> => {
  const { installerId, promoIds, countryCode } = props

  const currentDate = new Date()
  const buildNumber = getBuildNumber()
  const osType = Platform.OS.toLowerCase()
  const version = getVersion()
  const osVersion = getOsVersion()

  const filteredPromoData = filterInfoCards({
    buildNumber,
    cards: infoServerData.rollup?.promoCards2 ?? [],
    countryCode,
    currentDate,
    installerId,
    osType,
    osVersion,
    promoIds,
    version
  })

  return filteredPromoData.map(promo => promo.promoId).filter((id): id is string => id != null)
}
