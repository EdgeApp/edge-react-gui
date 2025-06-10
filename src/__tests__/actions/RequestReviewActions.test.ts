import { beforeEach, describe, expect, jest } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import { Action, Dispatch } from 'redux'

import {
  DEPOSIT_AMOUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  markAccountUpgraded,
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

const REVIEW_TRIGGER_DATA_FILE = 'review-trigger-data-test.json'

// Mock the store dispatch function
const mockDispatch = jest.fn() as jest.MockedFunction<Dispatch<Action>>

// Create a memory-based disklet for testing
let mockDisklet = makeMemoryDisklet()

// Define minimal LocalAccountSettings for testing
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
  reviewTrigger: {
    nextTriggerDate: undefined,
    swapCount: 0,
    depositAmountUsd: 0,
    transactionCount: 0,
    fiatPurchaseCount: 0,
    accountUpgraded: false,
    daysSinceUpgrade: []
  },
  tokenWarningsShown: [],
  accountNotifDismissInfo: {
    ip2FaNotifShown: false
  }
}

let mockAccount = {
  disklet: mockDisklet,
  localDisklet: mockDisklet
}

// Mock settings data storage
let mockSettings: LocalAccountSettings = { ...defaultSettings }

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

// Create typed mock functions for LocalSettingsActions
const mockReadLocalAccountSettings = jest.fn().mockImplementation(async (): Promise<LocalAccountSettings> => mockSettings)

const mockWriteReviewTriggerData = jest.fn().mockImplementation(async (_account: any, data: Partial<ReviewTriggerData>): Promise<LocalAccountSettings> => {
  // Create a complete ReviewTriggerData by merging with existing values
  const completeData: ReviewTriggerData = {
    ...mockSettings.reviewTrigger,
    ...data
  }

  // Update the mock settings with the new review trigger data
  mockSettings = { ...mockSettings, reviewTrigger: completeData }
  return mockSettings
}) as jest.MockedFunction<(
  account: any,
  data: Partial<ReviewTriggerData>
) => Promise<LocalAccountSettings>>

// Mock the LocalSettingsActions functions
jest.mock('../../actions/LocalSettingsActions', () => ({
  readLocalAccountSettings: mockReadLocalAccountSettings,
  writeReviewTriggerData: mockWriteReviewTriggerData
}))

// Define our test GetState function
type GetState = () => RootState
const getState = jest.fn(() => makeMockRootState()) as jest.MockedFunction<GetState>

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
    // Reset mockSettings before each test
    mockSettings = { ...defaultSettings }
    // Reset review trigger data before each test
    mockSettings.reviewTrigger = {
      nextTriggerDate: undefined,
      swapCount: 0,
      depositAmountUsd: 0,
      transactionCount: 0,
      fiatPurchaseCount: 0,
      accountUpgraded: false,
      daysSinceUpgrade: []
    }
    // Reset mocks and disklet before each test
    jest.clearAllMocks()
    mockDispatch.mockClear()
    // Create a fresh disklet for each test to avoid data persistence between tests
    mockDisklet = makeMemoryDisklet()
    mockAccount = { disklet: mockDisklet, localDisklet: mockDisklet }

    // Clear any data that might have been set in the review trigger file
    try {
      await mockDisklet.delete(REVIEW_TRIGGER_DATA_FILE)
    } catch (e) {
      // File might not exist, which is fine
    }
  })

  test('migrates data from legacy file', async () => {
    // Setup a legacy file with swap count data
    const mockSwapCountData = { swapCount: 7 }
    await mockDisklet.setText('swapCountData.json', JSON.stringify(mockSwapCountData))

    // Setup settings without review trigger data
    mockSettings = { ...defaultSettings, reviewTrigger: undefined as any } as LocalAccountSettings

    // Mock readLocalAccountSettings to return settings with reviewTrigger
    mockReadLocalAccountSettings.mockResolvedValueOnce({ ...mockSettings } as any)

    // Setup mock account with disklet
    const testMockAccount = {
      disklet: mockDisklet,
      localDisklet: mockDisklet
    }

    // Override getState for this test only
    const originalMock = getState.mockImplementation(
      () =>
        ({
          ...makeMockRootState(),
          core: {
            account: testMockAccount,
            disklet: mockDisklet
          }
        } as RootState)
    )

    // Simulate action that would trigger read/migrate
    const action = updateDepositAmount(100)
    await action(mockDispatch, getState)

    // Restore original implementation
    originalMock.mockRestore()

    // Verify data was migrated correctly
    const savedData = mockSettings.reviewTrigger
    expect(savedData?.swapCount).toBe(7)
  })

  describe('updateDepositAmount', () => {
    test('accumulates deposit amounts correctly', async () => {
      // Set up initial data in the disklet
      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: 100, // Starting with $100 already deposited
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      // Call the action with $50 deposit
      const action = updateDepositAmount(50)
      await action(mockDispatch, getState)

      // Get the saved data from mockSettings
      const savedData = mockSettings.reviewTrigger

      // Verify deposit amount was accumulated correctly
      expect(savedData.depositAmountUsd).toBe(150) // 100 + 50
    })

    test('triggers review when deposit amount reaches threshold', async () => {
      // Setup initial state just below threshold
      const initialAmount = DEPOSIT_AMOUNT_THRESHOLD - 10

      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: initialAmount,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      // Make a deposit that crosses the threshold
      const action = updateDepositAmount(20) // This should trigger review
      await action(mockDispatch, getState)

      // For review triggering, we now check that deposit amount was reset
      // This indicates the review was triggered

      // Get the saved data from mockSettings
      const savedData = mockSettings.reviewTrigger
      expect(savedData.depositAmountUsd).toBe(0) // Should be reset after trigger
    })

    test('respects nextTriggerDate and does not trigger review if date is in future', async () => {
      // Set nextTriggerDate to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const initialData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: DEPOSIT_AMOUNT_THRESHOLD + 100, // Well above threshold
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: [],
        nextTriggerDate: tomorrow.toISOString()
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      // Make a deposit
      const action = updateDepositAmount(50)
      await action(mockDispatch, getState)

      // We now verify review was not triggered by checking deposit amount is still accumulated
      // (not reset, which would indicate a review trigger)

      // Get the saved data from mockSettings
      const savedData = mockSettings.reviewTrigger
      expect(savedData.depositAmountUsd).toBe(DEPOSIT_AMOUNT_THRESHOLD + 150) // Continues accumulating
    })

    test('handles legacy file errors gracefully', async () => {
      // Setup settings without review trigger data
    mockSettings = { ...defaultSettings, reviewTrigger: undefined as any } as LocalAccountSettings

      // Mock readLocalAccountSettings to return settings without reviewTrigger
      mockReadLocalAccountSettings.mockResolvedValueOnce(mockSettings as any)

      // Setup a corrupt legacy file
      await mockDisklet.setText('swapCountData.json', '{invalid:json')

      // Simulate action that would trigger read/migrate
      const action = updateDepositAmount(100)
      await action(mockDispatch, getState)

      // Get the saved data from mockSettings
      const savedData = mockSettings.reviewTrigger

      expect(savedData?.depositAmountUsd).toBe(0) // Should be reset after trigger
    })

    test('does not migrate from legacy file if settings data exists', async () => {
      // Set nextTriggerDate to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // We'll set an initial review trigger state here
      const initialData: ReviewTriggerData = {
        nextTriggerDate: tomorrow.toISOString(),
        swapCount: 5,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }

      // Setup a legacy file with a DIFFERENT swap count
      const legacyData = { swapCount: 7 }
      await mockDisklet.setText('swapCountData.json', JSON.stringify(legacyData))

      // Setup settings WITH review trigger data - this should be used instead of legacy
      mockSettings = { ...defaultSettings }
      mockSettings.reviewTrigger = initialData
      const action = updateDepositAmount(100)
      await action(mockDispatch, getState)

      // Get the saved data from mockSettings
      const savedData = mockSettings.reviewTrigger

      expect(savedData.swapCount).toBe(5) // Should keep original, not migrate from legacy file
    })
  })

  describe('updateTransactionCount', () => {
    test('triggers when transaction count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: TRANSACTION_COUNT_THRESHOLD - 1,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      const action = updateTransactionCount()
      await action(mockDispatch, getState)

      // Get the updated data from mockSettings
      const savedData = mockSettings.reviewTrigger
      expect(savedData.transactionCount).toBe(0)
    })
  })

  describe('updateFiatPurchaseCount', () => {
    test('triggers when fiat purchase count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: FIAT_PURCHASE_COUNT_THRESHOLD - 1,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      const action = updateFiatPurchaseCount()
      await action(mockDispatch, getState)

      // Get the updated data from mockSettings
      const savedData = mockSettings.reviewTrigger
      expect(savedData.fiatPurchaseCount).toBe(0)
    })
  })

  describe('account upgrade flow', () => {
    test('marks account upgraded', async () => {
      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      const action = markAccountUpgraded()
      await action(mockDispatch, getState)

      const savedData = mockSettings.reviewTrigger
      expect(savedData.accountUpgraded).toBe(true)
      expect(savedData.daysSinceUpgrade.length).toBe(0)
    })

    test('tracks days after upgrade and triggers after threshold', async () => {
      jest.useFakeTimers()
      const baseDate = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(baseDate)

      const initialData: ReviewTriggerData = {
        nextTriggerDate: undefined,
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: true,
        daysSinceUpgrade: ['2022-12-30', '2022-12-31']
      }
      await mockDisklet.setText(REVIEW_TRIGGER_DATA_FILE, JSON.stringify(initialData))

      const action = trackAppUsageAfterUpgrade()
      await action(mockDispatch, getState)

      // Get the updated data from mockSettings
      const savedData = mockSettings.reviewTrigger
      expect(savedData.daysSinceUpgrade.length).toBe(0)

      jest.useRealTimers()
    })
  })
})
