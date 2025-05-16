import { asDate } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import { InfoCard } from 'edge-info-server'
import { Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import shajs from 'sha.js'

import { getLocalAccountSettings, writeAccountNotifInfo } from '../actions/LocalSettingsActions'
import { getLocaleOrDefaultString } from '../locales/intl'
import { DisplayInfoCard, filterInfoCards } from './infoUtils'
import { getOsVersion } from './utils'

/**
 * Generate a unique notification key for a promo card
 */
export const getPromoCardNotificationKey = (messageId: string): string => {
  return `promoCard-${messageId}`
}

export const getPromoCardMessageId = (localeMessages: InfoCard['localeMessages']): string => {
  const cardContent = localeMessages.en_US ?? JSON.stringify(localeMessages)
  return shajs('sha256').update(cardContent, 'utf8').digest('base64')
}

/**
 * Add a dismissed promo card to the notification center
 */
export const addPromoCardToNotifications = async (account: EdgeAccount, promoCard: DisplayInfoCard): Promise<void> => {
  const { ctaButton, messageId, localeMessages } = promoCard

  if (ctaButton == null) return
  const title = getLocaleOrDefaultString(ctaButton.localeLabels)
  if (title == null) return
  const body = getLocaleOrDefaultString(localeMessages)
  if (body == null) return
  const ctaUrl = getLocaleOrDefaultString(ctaButton.localeUrls)
  if (ctaUrl == null) return

  const notificationKey = getPromoCardNotificationKey(messageId)

  // Write directly to disk with our specific promo card notification format
  await writeAccountNotifInfo(account, notificationKey, {
    // Set the date to now
    dateReceived: new Date(),
    // Default notification parameters
    isPriority: false,
    isCompleted: false,
    isBannerHidden: true, // Always hide banner for promo cards

    // Promo card specific data
    params: {
      promoCard: {
        messageId,
        title,
        body,
        ctaUrl
      }
    }
  })
}

/**
 * Check if a promo card is valid in the current context
 * To be used when a user taps on a promo card notification
 */
export const isPromoCardValid = (messageId: string, currentPromoCards?: InfoCard[]): boolean => {
  // If we have no current promo cards, we can't validate
  if (currentPromoCards == null || currentPromoCards.length === 0) {
    return false
  }

  // Look for a matching promo card in the current cards
  for (const card of currentPromoCards) {
    // Generate a consistent messageId for comparison
    // This should match how DisplayInfoCard computes messageId in infoUtils.ts
    const cardMessageId = getPromoCardMessageId(card.localeMessages)

    if (messageId === cardMessageId) {
      // Card still exists in the current server data
      // We could do further validation here with filterInfoCards
      // to check if it's still valid for the current context
      return true
    }
  }

  return false
}

/**
 * Check for expired promos from the info server data that aren't already in the notification center
 * and add them as notifications
 */
export const checkAndAddExpiredPromos = async (
  account: EdgeAccount,
  infoCards: InfoCard[] = [],
  countryCode?: string,
  promoIds?: Array<string | null>,
  installerId?: string
): Promise<void> => {
  if (infoCards.length === 0) return

  // Get the current notification state
  const { notifState } = await getLocalAccountSettings(account)
  if (notifState == null) return

  // Get the current date to check for expired promos
  const currentDate = new Date()

  // First, filter the cards to get only those relevant to this device/user
  // but ignore the expiration check since we specifically want expired cards
  const buildNumber = getBuildNumber()
  const osType = Platform.OS.toLowerCase()
  const version = getVersion()
  const osVersion = getOsVersion()

  // Use filterInfoCards with ignoreExpiration to get all cards that would have been
  // relevant to this user regardless of expiration date
  const relevantCards = filterInfoCards({
    cards: infoCards,
    countryCode,
    promoIds,
    installerId,
    buildNumber,
    currentDate,
    osType,
    osVersion,
    version,
    ignoreExpiration: true // Skip the expiration check in the filter
  })

  // Now check each relevant card for expired ones
  for (const card of relevantCards) {
    // Skip cards without an end date
    if (card.endIsoDate == null) continue

    try {
      // Parse the end date
      const endDate = asDate(card.endIsoDate)

      // If the end date is in the past, the promo has expired
      if (currentDate.valueOf() > endDate.valueOf()) {
        // Generate a message ID for this card to use as the notification key
        const messageId = getPromoCardMessageId(card.localeMessages)
        const notificationKey = getPromoCardNotificationKey(messageId)

        // Check if we already have this promo in the notification center
        if (notifState[notificationKey] != null) continue

        // Try to get the title and body content
        const title = getLocaleContent(card)
        const ctaTitle = getCTATitle(card)
        const ctaUrl = getCTAUrl(card)

        // Skip if we can't get valid content
        if (title == null || ctaTitle == null || ctaUrl == null) continue

        // Add to notification center as a notification
        await writeAccountNotifInfo(account, notificationKey, {
          dateReceived: endDate, // Use the expiration date
          isPriority: false,
          isCompleted: false,
          isBannerHidden: true, // Always hide banner for expired promos
          params: {
            promoCard: {
              messageId,
              title: ctaTitle,
              body: title,
              ctaUrl
            }
          }
        })
      }
    } catch (error) {
      console.error('Error processing expired promo:', error)
      // Continue with the next card
    }
  }
}

/**
 * Helper function to get the localized content from an InfoCard
 */
const getLocaleContent = (card: InfoCard): string | null => {
  const localeContent = getLocaleOrDefaultString(card.localeMessages)
  return localeContent != null && localeContent.trim() !== '' ? localeContent : null
}

/**
 * Helper function to get the CTA title from an InfoCard
 */
const getCTATitle = (card: InfoCard): string | null => {
  if (card.ctaButton == null) return null
  const title = getLocaleOrDefaultString(card.ctaButton.localeLabels)
  return title != null && title.trim() !== '' ? title : null
}

/**
 * Helper function to get the CTA URL from an InfoCard
 */
const getCTAUrl = (card: InfoCard): string | null => {
  if (card.ctaButton == null) return null
  const url = getLocaleOrDefaultString(card.ctaButton.localeUrls)
  return url != null && url.trim() !== '' ? url : null
}
