import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import InAppReview from 'react-native-in-app-review'
import * as StoreReview from 'react-native-store-review'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { ReviewTriggerData } from '../types/types'
import { readLocalAccountSettings, writeReviewTriggerData } from './LocalSettingsActions'

// Legacy file for backward compatibility
export const SWAP_COUNT_DATA_FILE = 'swapCountData.json' // Legacy file for backward compatibility

// Trigger thresholds
export const SWAP_COUNT_THRESHOLD = 3
export const DEPOSIT_AMOUNT_THRESHOLD = 500 // $500 USD
export const TRANSACTION_COUNT_THRESHOLD = 10
export const FIAT_PURCHASE_COUNT_THRESHOLD = 6
export const ACCOUNT_UPGRADE_DAYS_THRESHOLD = 3

// ReviewTriggerData interface is now defined in types.ts

/**
 * Initialize review trigger data with default values
 */
const initReviewTriggerData = (): ReviewTriggerData => ({
  swapCount: 0,
  depositAmountUsd: 0,
  transactionCount: 0,
  fiatPurchaseCount: 0,
  accountUpgraded: false,
  daysSinceUpgrade: [],
  nextTriggerDate: undefined
})

/**
 * Shows a review request to the user based on the platform
 */
const requestReview = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    StoreReview.requestReview()
    return true
  } else if (Platform.OS === 'android') {
    if (InAppReview.isAvailable()) {
      // In-app review with comment support
      await InAppReview.RequestInAppReview()
      return true
    } else {
      const title = sprintf(lstrings.request_review_question_title, config.appNameShort)
      const result = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={title}
          message={lstrings.request_review_question_subtitle}
          buttons={{
            ok: { label: lstrings.request_review_answer_yes },
            cancel: { label: lstrings.request_review_answer_no }
          }}
        />
      ))
      if (result === 'ok') {
        await Linking.openURL(lstrings.request_review_android_page_link)
        return true
      }
      return false
    }
  } else {
    console.warn(`Unhandled Platform.OS: ${Platform.OS}. Unable to request review from user`)
    return false
  }
}

/**
 * Read the current review trigger data from account settings
 * Handles migration from old data file if necessary
 */
export const readReviewTriggerData = async (account: EdgeAccount): Promise<ReviewTriggerData> => {
  try {
    // Get settings from account
    const settings = await readLocalAccountSettings(account)

    // If review trigger data exists in settings, use it
    if (settings.reviewTrigger != null) {
      return settings.reviewTrigger
    }

    // Settings exists but no review trigger data yet
    // Check for legacy file
    try {
      // Check if old swap count file exists and migrate data
      const swapCountDataStr = await account.localDisklet.getText(SWAP_COUNT_DATA_FILE)
      const swapCountData = JSON.parse(swapCountDataStr)

      // Initialize new data structure with old swap count data
      const migratedData: ReviewTriggerData = {
        ...initReviewTriggerData(),
        swapCount: parseInt(swapCountData.swapCount) || 0
      }

      // If user was already asked for review in the old system,
      // set nextTriggerDate to 1 year in the future
      if (swapCountData.hasReviewBeenRequested) {
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        migratedData.nextTriggerDate = nextYear.toISOString()
      }

      // Save the migrated data to settings
      await writeReviewTriggerData(account, migratedData)

      // Return the migrated data
      return migratedData
    } catch (err: any) {
      // Legacy file doesn't exist either, initialize with defaults
      return initReviewTriggerData()
    }
  } catch (e: any) {
    // Error reading settings, return defaults
    return initReviewTriggerData()
  }
}

/**
 * Save review trigger data to account settings
 * First reads existing data and merges with provided data
 */
const saveReviewTriggerData = async (account: EdgeAccount, data: Partial<ReviewTriggerData>): Promise<void> => {
  try {
    // Read existing data first to ensure we preserve any fields not included in the update
    const existingData = await readReviewTriggerData(account)

    // Merge existing data with updates
    const mergedData: ReviewTriggerData = {
      ...existingData,
      ...data
    }

    // Save the merged data to settings
    await writeReviewTriggerData(account, mergedData)
  } catch (e: unknown) {
    console.log('RequestReviewActions: Error writing review trigger data to settings:', e)
  }
}

/**
 * Check if we should trigger a review request
 */
const shouldTriggerReview = (data: ReviewTriggerData): boolean => {
  // If nextTriggerDate is set and is in the future, don't trigger
  if (data.nextTriggerDate != null) {
    const nextTriggerDate = new Date(data.nextTriggerDate)
    const now = new Date()
    if (nextTriggerDate > now) return false
  }
  return true
}

/**
 * Set the next trigger date based on user response
 */
const setNextTriggerDate = (data: ReviewTriggerData, reviewed: boolean): ReviewTriggerData => {
  const now = new Date()
  const nextTriggerDate = new Date(now)

  // If user did the review, set next trigger one year later
  // Otherwise, set it one month later
  if (reviewed) {
    nextTriggerDate.setFullYear(now.getFullYear() + 1)
  } else {
    nextTriggerDate.setMonth(now.getMonth() + 1)
  }

  return {
    ...data,
    nextTriggerDate: nextTriggerDate.toISOString()
  }
}

/**
 * Process a potential review trigger
 */
const processReviewTrigger = async (
  account: EdgeAccount,
  data: ReviewTriggerData,
  resetFunction: (data: ReviewTriggerData) => Partial<ReviewTriggerData>
): Promise<void> => {
  if (shouldTriggerReview(data)) {
    const reviewed = await requestReview()
    // Set next trigger date appropriately
    const updatedData = setNextTriggerDate(data, reviewed)
    // Reset the counter that triggered this review
    const resetData = resetFunction(updatedData)
    await saveReviewTriggerData(account, resetData)
  } else {
    // Threshold reached but cannot trigger yet. Persist updated data
    await saveReviewTriggerData(account, data)
  }
}

/**
 * Handle the swap trigger
 */
export const updateSwapCount = (): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // Increment swap count
      const updatedData = {
        ...data,
        swapCount: data.swapCount + 1
      }

      // Check if threshold has been reached
      if (updatedData.swapCount >= SWAP_COUNT_THRESHOLD) {
        // Process potential review trigger
        await processReviewTrigger(account, updatedData, data => ({
          ...data,
          swapCount: 0 // Reset swap count after triggering review
        }))
      } else {
        // Just update the data without triggering
        await saveReviewTriggerData(account, updatedData)
      }
    } catch (e: unknown) {
      console.log('Error updating swap count:', e)
    }
  }
}

/**
 * Handle the deposit trigger - tracks deposits in USD
 */
export const updateDepositAmount = (amountUsd: number): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // Add deposit amount (in USD)
      const updatedData = {
        ...data,
        depositAmountUsd: data.depositAmountUsd + amountUsd
      }

      // Check if threshold has been reached
      if (updatedData.depositAmountUsd >= DEPOSIT_AMOUNT_THRESHOLD) {
        // Process potential review trigger
        await processReviewTrigger(account, updatedData, data => ({
          ...data,
          depositAmountUsd: 0 // Reset deposit amount after triggering review
        }))
      } else {
        // Just update the data without triggering
        await saveReviewTriggerData(account, updatedData)
      }
    } catch (e: unknown) {
      console.log('Error updating deposit amount:', e)
    }
  }
}

/**
 * Handle the transaction trigger - counts send/receive transactions
 * Note: This increments the counter for each new transaction notification
 * or send operation, avoiding double counting for swaps/sells.
 */
export const updateTransactionCount = (): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // Increment transaction count
      const updatedData = {
        ...data,
        transactionCount: data.transactionCount + 1
      }

      // Check if threshold reached
      if (updatedData.transactionCount >= TRANSACTION_COUNT_THRESHOLD) {
        await processReviewTrigger(
          account,
          updatedData,
          // Reset function to clear transaction count
          data => ({ ...data, transactionCount: 0 })
        )
      } else {
        // Just save the updated count
        await saveReviewTriggerData(account, updatedData)
      }
    } catch (e: unknown) {
      console.log('Error updating transaction count:', e)
    }
  }
}

/**
 * Handle the fiat purchase trigger - counts fiat purchases/sells
 */
export const updateFiatPurchaseCount = (): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // Increment fiat purchase count
      const updatedData = {
        ...data,
        fiatPurchaseCount: data.fiatPurchaseCount + 1
      }

      // Check if threshold reached
      if (updatedData.fiatPurchaseCount >= FIAT_PURCHASE_COUNT_THRESHOLD) {
        await processReviewTrigger(
          account,
          updatedData,
          // Reset function to clear fiat purchase count
          data => ({ ...data, fiatPurchaseCount: 0 })
        )
      } else {
        // Just save the updated count
        await saveReviewTriggerData(account, updatedData)
      }
    } catch (e: unknown) {
      console.log('Error updating fiat purchase count:', e)
    }
  }
}

/**
 * Mark account as upgraded from light to full account
 */
export const markAccountUpgraded = (): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // Skip if already marked as upgraded
      if (data.accountUpgraded) return

      // Mark as upgraded and reset days counter
      const updatedData = {
        ...data,
        accountUpgraded: true,
        daysSinceUpgrade: []
      }

      // Save the updated data
      await saveReviewTriggerData(account, updatedData)
    } catch (e: unknown) {
      console.log('Error marking account as upgraded:', e)
    }
  }
}

/**
 * Track app usage after account upgrade
 * Call this when app is launched to potentially record a new day
 */
export const trackAppUsageAfterUpgrade = (): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    try {
      // Get review trigger data (handles initialization if needed)
      const data = await readReviewTriggerData(account)

      // If account is not upgraded, nothing to do
      if (!data.accountUpgraded) return

      // Get today's date as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]

      // Skip if we already recorded usage for today
      if (data.daysSinceUpgrade.includes(today)) return

      // Add today to the list of days since upgrade
      const updatedData = {
        ...data,
        daysSinceUpgrade: [...data.daysSinceUpgrade, today]
      }

      // Check if threshold reached
      if (updatedData.daysSinceUpgrade.length >= ACCOUNT_UPGRADE_DAYS_THRESHOLD) {
        await processReviewTrigger(
          account,
          updatedData,
          // Reset function to clear days counter
          data => ({
            ...data,
            accountUpgraded: false, // Reset upgrade flag
            daysSinceUpgrade: [] // Clear days list
          })
        )
      } else {
        // Just save the updated days list
        await saveReviewTriggerData(account, updatedData)
      }
    } catch (e: unknown) {
      console.log('Error tracking app usage after upgrade:', e)
    }
  }
}
