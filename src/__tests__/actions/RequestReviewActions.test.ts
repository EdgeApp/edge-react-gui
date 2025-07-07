import { beforeEach, describe, expect, jest } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js'
import { Action, Dispatch } from 'redux'

import { LOCAL_SETTINGS_FILENAME } from '../../actions/LocalSettingsActions'
import {
  DEPOSIT_AMOUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  markAccountUpgraded,
  readReviewTriggerData,
  SWAP_COUNT_DATA_FILE,
  trackAppUsageAfterUpgrade,
  TRANSACTION_COUNT_THRESHOLD,
  updateDepositAmount,
  updateFiatPurchaseCount,
  updateTransactionCount
} from '../../actions/RequestReviewActions'
import { RootState } from '../../reducers/RootReducer'
import { LocalAccountSettings, ReviewTriggerData } from '../../types/types'

// Provide a virtual env.json so importing env.ts does not fail
jest.mock('../../../env.json', () => ({}), { virtual: true })

// Mock the store dispatch function
const mockDispatch = jest.fn() as jest.MockedFunction<Dispatch<Action>>

// Create a memory-based disklet for testing
let mockDisklet = makeMemoryDisklet()

// Create a mock account with our test disklet
const defaultAccount: EdgeAccount = {
  id: '',
  currencyWallets: {},
  currencyConfig: {},
  watch() {}
} as unknown as EdgeAccount
let mockAccount = defaultAccount

// Default settings to use for tests
const defaultReviewTrigger: ReviewTriggerData = {
  nextTriggerDate: undefined,
  swapCount: 0,
  depositAmountUsd: 0,
  transactionCount: 0,
  fiatPurchaseCount: 0,
  accountUpgraded: false,
  daysSinceUpgrade: []
}
const defaultSettings: LocalAccountSettings = {
  contactsPermissionShown: false,
  developerModeOn: false,
  isAccountBalanceVisible: true,
  notifState: {},
  passwordReminder: {
    needsPasswordCheck: false,
    lastLoginDate: Date.now(),
    lastPasswordUseDate: Date.now(),
    passwordUseCount: 0,
    nonPasswordLoginsCount: 0,
    nonPasswordDaysLimit: 2,
    nonPasswordLoginsLimit: 4
  },
  spamFilterOn: true,
  spendingLimits: {
    transaction: { amount: 0, isEnabled: false }
  },
  reviewTrigger: defaultReviewTrigger,
  tokenWarningsShown: [],
  accountNotifDismissInfo: {
    ip2FaNotifShown: false
  }
}

// Create a minimal mock state that satisfies what our actions need
const makeMockRootState = (): RootState => {
  // Create a partial state with just what we need
  const partialState = {
    core: {
      account: mockAccount
    }
  }

  // Cast it to RootState - this is safe for testing since our actions
  // only access core.account
  return partialState as unknown as RootState
}

// Define our test GetState function
type GetState = () => RootState
const getState: GetState = () => makeMockRootState()

// Mock the modules that would cause issues in the test environment
jest.mock('react-native-store-review', () => ({
  // We'll test disk data instead of verifying this was called
  requestReview: jest.fn()
}))

jest.mock('react-native-in-app-review', () => ({
  isAvailable: jest.fn().mockReturnValue(false)
}))

describe('RequestReviewActions', () => {
  beforeEach(async () => {
    // Create a fresh disklet for each test to avoid data persistence between tests
    mockDisklet = makeMemoryDisklet()
    mockAccount = {
      ...defaultAccount,
      disklet: mockDisklet,
      localDisklet: mockDisklet
    } as unknown as EdgeAccount
  })

  describe('updateDepositAmount', () => {
    test('accumulates deposit amounts correctly', async () => {
      // Setup initial settings with $100 deposit amount in the Settings.json file
      const initialSettings = {
        ...defaultSettings,
        reviewTrigger: {
          ...defaultReviewTrigger,
          depositAmountUsd: 100
        }
      }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      // Call the action with $50 deposit
      const action = updateDepositAmount(50)
      await action(mockDispatch, getState)

      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.depositAmountUsd).toBe(150) // 100 + 50
    })

    test('triggers review when deposit amount reaches threshold', async () => {
      // Setup initial state just below threshold
      const initialAmount = DEPOSIT_AMOUNT_THRESHOLD - 10

      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        depositAmountUsd: initialAmount
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      // Make a deposit that crosses the threshold
      const action = updateDepositAmount(20) // This should trigger review
      await action(mockDispatch, getState)

      // For review triggering, we now check that deposit amount was reset
      // This indicates the review was triggered

      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.depositAmountUsd).toBe(0) // Should be reset after trigger
    })

    test('respects nextTriggerDate and does not trigger review if date is in future', async () => {
      // Set nextTriggerDate to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        depositAmountUsd: DEPOSIT_AMOUNT_THRESHOLD + 100, // Well above threshold
        nextTriggerDate: tomorrow
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      // Make a deposit
      const action = updateDepositAmount(50)
      await action(mockDispatch, getState)

      // We now verify review was not triggered by checking deposit amount is still accumulated
      // (not reset, which would indicate a review trigger)
      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.depositAmountUsd).toBe(
        DEPOSIT_AMOUNT_THRESHOLD + 150
      ) // Continues accumulating
    })

    test('handles empty or corrupt data file gracefully', async () => {
      // No need to mock an error - disklet will naturally return undefined for non-existent files

      const action = updateDepositAmount(100)
      await action(mockDispatch, getState)

      // Read the saved data from disklet
      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.depositAmountUsd).toBe(100)
      expect(reviewTriggerData.swapCount).toBe(0)
    })
  })

  describe('updateTransactionCount', () => {
    test('triggers when transaction count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        transactionCount: TRANSACTION_COUNT_THRESHOLD - 1
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      const action = updateTransactionCount()
      await action(mockDispatch, getState)

      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.transactionCount).toBe(0)
    })
  })

  describe('updateFiatPurchaseCount', () => {
    test('triggers when fiat purchase count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        fiatPurchaseCount: FIAT_PURCHASE_COUNT_THRESHOLD - 1
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      const action = updateFiatPurchaseCount()
      await action(mockDispatch, getState)

      // Read saved data - reset fiat purchase count indicates review was triggered
      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.fiatPurchaseCount).toBe(0)
    })
  })

  describe('account upgrade flow', () => {
    test('marks account upgraded', async () => {
      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        accountUpgraded: false
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      const action = markAccountUpgraded()
      await action(mockDispatch, getState)

      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.accountUpgraded).toBe(true)
      expect(reviewTriggerData.daysSinceUpgrade.length).toBe(0)
    })

    test('tracks days after upgrade and triggers after threshold', async () => {
      jest.useFakeTimers()
      const baseDate = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(baseDate)

      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        accountUpgraded: true,
        daysSinceUpgrade: ['2022-12-30', '2022-12-31']
      }
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      const action = trackAppUsageAfterUpgrade()
      await action(mockDispatch, getState)

      // Check if days since upgrade was not reset
      const reviewTriggerData = await readReviewTriggerData(mockAccount)
      expect(reviewTriggerData.daysSinceUpgrade.length).toBe(3)

      jest.useRealTimers()
    })
  })

  describe('legacy data migration', () => {
    test('migrates data from legacy file', async () => {
      // Set up a clean test disklet and account
      const testDisklet = makeMemoryDisklet()
      const testAccount = {
        disklet: testDisklet,
        localDisklet: testDisklet
      } as unknown as EdgeAccount

      // Create empty settings file first (no reviewTrigger property)
      const initialSettings = { ...defaultSettings, reviewTrigger: undefined }
      await testDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      // Set up legacy data file with numeric string for swapCount
      const mockSwapCountData = {
        swapCount: '7',
        hasReviewBeenRequested: false
      }
      await testDisklet.setText(
        SWAP_COUNT_DATA_FILE,
        JSON.stringify(mockSwapCountData)
      )

      // Directly call readReviewTriggerData to see what it reads
      const readData = await readReviewTriggerData(testAccount)

      // The function should have read the legacy data and migrated it
      expect(readData.swapCount).toBe(7)

      // Also verify that the data was written to settings file
      const settingsJson = await testDisklet.getText(LOCAL_SETTINGS_FILENAME)
      const settings = JSON.parse(settingsJson) as LocalAccountSettings
      expect(settings.reviewTrigger?.swapCount).toBe(7)
    })

    test('does not migrate from legacy file if settings data exists', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const initialData: ReviewTriggerData = {
        ...defaultReviewTrigger,
        nextTriggerDate: tomorrow,
        swapCount: 5
      }

      // Setup settings WITH review trigger data - this should be used instead of legacy
      const initialSettings = { ...defaultSettings, reviewTrigger: initialData }
      await mockDisklet.setText(
        LOCAL_SETTINGS_FILENAME,
        JSON.stringify(initialSettings)
      )

      // Setup a legacy file with a DIFFERENT swap count
      const legacyData = { swapCount: 7 }
      await mockDisklet.setText(
        SWAP_COUNT_DATA_FILE,
        JSON.stringify(legacyData)
      )

      // Run our action
      const action = updateDepositAmount(100)
      await action(mockDispatch, getState)

      // Verify the original settings data was kept (not overwritten by legacy)
      const reviewTriggerData = await readReviewTriggerData(mockAccount)

      // Should keep original value from settings, not migrate from legacy file
      expect(reviewTriggerData.swapCount).toBe(5)
      // And our deposit was applied
      expect(reviewTriggerData.depositAmountUsd).toBe(100)
    })
  })
})
