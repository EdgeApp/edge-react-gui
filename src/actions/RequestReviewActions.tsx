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

// File to store all review trigger data
export const REVIEW_TRIGGER_DATA_FILE = 'reviewTriggerData.json'
export const SWAP_COUNT_DATA_FILE = 'swapCountData.json' // Legacy file for backward compatibility

// Trigger thresholds
export const SWAP_COUNT_THRESHOLD = 3
export const DEPOSIT_AMOUNT_THRESHOLD = 500 // $500 USD
export const TRANSACTION_COUNT_THRESHOLD = 10
export const FIAT_PURCHASE_COUNT_THRESHOLD = 6
export const ACCOUNT_UPGRADE_DAYS_THRESHOLD = 3

/**
 * Interface for the data structure saved to disk
 */
interface ReviewTriggerData {
  /** Review status */
  nextTriggerDate?: string // ISO date string for when the next review can be requested

  /** Swap trigger */
  swapCount: number

  /** Deposit trigger */
  depositAmountUsd: number // Tracks total deposits in USD

  /** Transaction trigger */
  transactionCount: number

  /** Fiat purchase trigger */
  fiatPurchaseCount: number

  /** Account upgrade trigger */
  accountUpgraded: boolean

  /** List of logged in day timestamps after upgrading */
  daysSinceUpgrade: string[]
}

/**
 * Initialize review trigger data with default values
 */
const initReviewTriggerData = (): ReviewTriggerData => ({
  swapCount: 0,
  depositAmountUsd: 0,
  transactionCount: 0,
  fiatPurchaseCount: 0,
  accountUpgraded: false,
  daysSinceUpgrade: []
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
 * Read the current review trigger data from disk
 * Handles migration from old data file if necessary
 */
const readReviewTriggerData = async (account: any): Promise<ReviewTriggerData> => {
  try {
    // Try to read from the new data file
    const dataStr = await account.disklet.getText(REVIEW_TRIGGER_DATA_FILE)
    return JSON.parse(dataStr)
  } catch (e: any) {
    // File doesn't exist yet, so check for legacy file
    try {
      // Check if old swap count file exists and migrate data
      const swapCountDataStr = await account.disklet.getText(SWAP_COUNT_DATA_FILE)
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

      // Save the migrated data to the new file
      await saveReviewTriggerData(account, migratedData)

      // Return the migrated data
      return migratedData
    } catch (err: any) {
      // Neither file exists, so initialize with defaults
      return initReviewTriggerData()
    }
  }
}

/**
 * Save review trigger data to disk
 */
const saveReviewTriggerData = async (account: any, data: ReviewTriggerData): Promise<void> => {
  const dataStr = JSON.stringify(data)
  await account.disklet.setText(REVIEW_TRIGGER_DATA_FILE, dataStr).catch((e: unknown) => {
    console.log(`RequestReviewActions: Error writing file ${REVIEW_TRIGGER_DATA_FILE}:`, e)
  })
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
const processReviewTrigger = async (account: any, data: ReviewTriggerData, shouldReset: (data: ReviewTriggerData) => ReviewTriggerData): Promise<void> => {
  if (shouldTriggerReview(data)) {
    const reviewed = await requestReview()
    // Set next trigger date appropriately
    const updatedData = setNextTriggerDate(data, reviewed)
    // Reset the counter that triggered this review
    const resetData = shouldReset(updatedData)
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
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
    const data = await readReviewTriggerData(account)

    // Increment swap count
    const updatedData = {
      ...data,
      swapCount: data.swapCount + 1
    }

    // Check if threshold reached
    if (updatedData.swapCount >= SWAP_COUNT_THRESHOLD) {
      await processReviewTrigger(
        account,
        updatedData,
        // Reset function to clear swap count
        data => ({ ...data, swapCount: 0 })
      )
    } else {
      // Just save the updated count
      await saveReviewTriggerData(account, updatedData)
    }
  }
}

/**
 * Handle the deposit trigger - tracks deposits in USD
 */
export const updateDepositAmount = (amountUsd: number): ThunkAction<Promise<void>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
    const data = await readReviewTriggerData(account)

    // Add deposit amount (in USD)
    const updatedData = {
      ...data,
      depositAmountUsd: data.depositAmountUsd + amountUsd
    }

    // Check if threshold reached
    if (updatedData.depositAmountUsd >= DEPOSIT_AMOUNT_THRESHOLD) {
      await processReviewTrigger(
        account,
        updatedData,
        // Reset function to clear deposit amount
        data => ({ ...data, depositAmountUsd: 0 })
      )
    } else {
      // Just save the updated amount
      await saveReviewTriggerData(account, updatedData)
    }
  }
}

/**
 * Handle the transaction trigger - counts send/receive transactions
 * Note: This increments the counter for each new transaction notification
 * or send operation, avoiding double counting for swaps/sells.
 */
export const updateTransactionCount = (): ThunkAction<Promise<void>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
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
  }
}

/**
 * Handle the fiat purchase trigger - counts fiat purchases/sells
 */
export const updateFiatPurchaseCount = (): ThunkAction<Promise<void>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
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
  }
}

/**
 * Mark account as upgraded from light to full account
 */
export const markAccountUpgraded = (): ThunkAction<Promise<void>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
    const data = await readReviewTriggerData(account)

    // Mark account as upgraded if it wasn't already
    if (!data.accountUpgraded) {
      const updatedData = {
        ...data,
        accountUpgraded: true,
        daysSinceUpgrade: []
      }

      await saveReviewTriggerData(account, updatedData)
    }
  }
}

/**
 * Track app usage after account upgrade
 * Call this when app is launched to potentially record a new day
 */
export const trackAppUsageAfterUpgrade = (): ThunkAction<Promise<void>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Read current data
    const data = await readReviewTriggerData(account)

    // If account is not upgraded, nothing to do
    if (!data.accountUpgraded) {
      return
    }

    // Get today's date as YYYY-MM-DD string for comparison
    const today = new Date().toISOString().split('T')[0]

    // Check if we already recorded this day
    const days = data.daysSinceUpgrade != null ? data.daysSinceUpgrade : []
    if (!days.includes(today)) {
      // Add today to the list of days
      const updatedDays = [...days, today]
      const updatedData = {
        ...data,
        daysSinceUpgrade: updatedDays
      }

      // Check if threshold reached
      if (updatedDays.length >= ACCOUNT_UPGRADE_DAYS_THRESHOLD) {
        await processReviewTrigger(
          account,
          updatedData,
          // Reset function to clear days since upgrade but keep account as upgraded
          data => ({ ...data, daysSinceUpgrade: [] })
        )
      } else {
        // Just save the updated days
        await saveReviewTriggerData(account, updatedData)
      }
    }
  }
}
