import { beforeEach, describe, expect, jest } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import { Action, Dispatch } from 'redux'

import {
  DEPOSIT_AMOUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  markAccountUpgraded,
  REVIEW_TRIGGER_DATA_FILE,
  ReviewTriggerData,
  trackAppUsageAfterUpgrade,
  TRANSACTION_COUNT_THRESHOLD,
  updateDepositAmount,
  updateFiatPurchaseCount,
  updateTransactionCount
} from '../../actions/RequestReviewActions'
import { RootState } from '../../reducers/RootReducer'

// Provide a virtual env.json so importing env.ts does not fail
jest.mock('../../../env.json', () => ({}), { virtual: true })

// Mock the store dispatch function
const mockDispatch = jest.fn() as jest.MockedFunction<Dispatch<Action>>

// Create a memory-based disklet for testing
let mockDisklet = makeMemoryDisklet()

let mockAccount = {
  disklet: mockDisklet
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
    // Reset mocks and disklet before each test
    jest.clearAllMocks()
    mockDispatch.mockClear()
    // Create a fresh disklet for each test to avoid data persistence between tests
    mockDisklet = makeMemoryDisklet()
    mockAccount = { disklet: mockDisklet }

    // Clear any data that might have been set in the review trigger file
    try {
      await mockDisklet.delete(REVIEW_TRIGGER_DATA_FILE)
    } catch (e) {
      // File might not exist, which is fine
    }
  })

  describe('updateDepositAmount', () => {
    test('accumulates deposit amounts correctly', async () => {
      // Set up initial data in the disklet
      const initialData: ReviewTriggerData = {
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

      // Read the saved data from disklet
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const savedData = JSON.parse(savedJsonData)

      // Verify deposit amount was accumulated correctly
      expect(savedData.depositAmountUsd).toBe(150) // 100 + 50
    })

    test('triggers review when deposit amount reaches threshold', async () => {
      // Setup initial state just below threshold
      const initialAmount = DEPOSIT_AMOUNT_THRESHOLD - 10

      const initialData: ReviewTriggerData = {
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

      // Read the saved data from disklet
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const savedData = JSON.parse(savedJsonData)
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

      // Read the saved data from disklet
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const savedData = JSON.parse(savedJsonData)
      expect(savedData.depositAmountUsd).toBe(DEPOSIT_AMOUNT_THRESHOLD + 150) // Continues accumulating
    })

    test('handles empty or corrupt data file gracefully', async () => {
      // No need to mock an error - disklet will naturally return undefined for non-existent files

      const action = updateDepositAmount(100)
      await action(mockDispatch, getState)

      // Read the saved data from disklet
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const savedData = JSON.parse(savedJsonData)
      expect(savedData.depositAmountUsd).toBe(100)
      expect(savedData.swapCount).toBe(0)
    })
  })

  describe('updateTransactionCount', () => {
    test('triggers when transaction count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
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

      // Read saved data - reset transaction count indicates review was triggered
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const saved = JSON.parse(savedJsonData)
      expect(saved.transactionCount).toBe(0)
    })
  })

  describe('updateFiatPurchaseCount', () => {
    test('triggers when fiat purchase count reaches threshold', async () => {
      const initialData: ReviewTriggerData = {
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

      // Read saved data - reset fiat purchase count indicates review was triggered
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const saved = JSON.parse(savedJsonData)
      expect(saved.fiatPurchaseCount).toBe(0)
    })
  })

  describe('account upgrade flow', () => {
    test('marks account upgraded', async () => {
      const initialData: ReviewTriggerData = {
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

      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const saved = JSON.parse(savedJsonData)
      expect(saved.accountUpgraded).toBe(true)
      expect(saved.daysSinceUpgrade.length).toBe(0)
    })

    test('tracks days after upgrade and triggers after threshold', async () => {
      jest.useFakeTimers()
      const baseDate = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(baseDate)

      const initialData: ReviewTriggerData = {
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

      // Check if days since upgrade was reset, indicating review was triggered
      const savedJsonData = await mockDisklet.getText(REVIEW_TRIGGER_DATA_FILE)
      const saved = JSON.parse(savedJsonData)
      expect(saved.daysSinceUpgrade.length).toBe(0)

      jest.useRealTimers()
    })
  })
})
