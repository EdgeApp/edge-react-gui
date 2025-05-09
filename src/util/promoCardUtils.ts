import { EdgeAccount } from 'edge-core-js'
import { InfoCard } from 'edge-info-server'
import shajs from 'sha.js'

import { writeAccountNotifInfo } from '../actions/LocalSettingsActions'
import { getLocaleOrDefaultString } from '../locales/intl'
import { DisplayInfoCard } from './infoUtils'
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
