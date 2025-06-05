import { expect, jest, test } from '@jest/globals'
import { Dispatch } from 'redux'

import {
  DEPOSIT_AMOUNT_THRESHOLD,
  TRANSACTION_COUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  ACCOUNT_UPGRADE_DAYS_THRESHOLD,
  ReviewTriggerData,
  updateDepositAmount,
  updateTransactionCount,
  updateFiatPurchaseCount,
  markAccountUpgraded,
  trackAppUsageAfterUpgrade
} from '../../actions/RequestReviewActions'

// Provide a virtual env.json so importing env.ts does not fail
jest.mock('../../../env.json', () => ({}), { virtual: true })
import { Action } from '../../types/reduxTypes'

// Mock the store dispatch function
const mockDispatch = jest.fn() as jest.MockedFunction<Dispatch<Action>>

// Mock the Account object with a disklet
const mockDisklet = {
  getText: jest.fn().mockResolvedValue(''),
  setText: jest.fn().mockResolvedValue(undefined)
}

const mockAccount = {
  disklet: mockDisklet
}

// Type for our Redux state getter function
interface AppState {
  core: {
    account: typeof mockAccount
  }
}

type GetState = () => AppState

// Mock the modules that would cause issues in the test environment
jest.mock('react-native-store-review', () => ({
  requestReview: jest.fn()
}))

jest.mock('react-native-in-app-review', () => ({
  isAvailable: jest.fn().mockReturnValue(false)
}))

// Capture calls to the StoreReview module
const mockRequestReview = require('react-native-store-review').requestReview as jest.Mock

describe('RequestReviewActions', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks()
    mockDispatch.mockClear()
    mockDisklet.getText.mockClear()
    mockDisklet.setText.mockClear()
  })

  describe('updateDepositAmount', () => {
    test('accumulates deposit amounts correctly', async () => {
      // Mock the disklet to return valid data
      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: 100, // Starting with $100 already deposited
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      // Call the action with $50 deposit
      const action = updateDepositAmount(50)
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      // Verify disklet was called to save updated data
      expect(mockDisklet.setText).toHaveBeenCalledTimes(1)

      // Extract the saved data
      const savedJsonData = mockDisklet.setText.mock.calls[0][1] as string
      const savedData = JSON.parse(savedJsonData)

      // Verify deposit amount was accumulated correctly
      expect(savedData.depositAmountUsd).toBe(150) // 100 + 50
    })

    test('triggers review when deposit amount reaches threshold', async () => {
      // Setup initial state just below threshold
      const initialAmount = DEPOSIT_AMOUNT_THRESHOLD - 10

      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: initialAmount,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      // Make a deposit that crosses the threshold
      const action = updateDepositAmount(20) // This should trigger review
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      // Verify review was requested
      expect(mockRequestReview).toHaveBeenCalledTimes(1)

      // Verify data was saved with reset deposit amount
      const savedJsonData = mockDisklet.setText.mock.calls[0][1] as string
      const savedData = JSON.parse(savedJsonData)
      expect(savedData.depositAmountUsd).toBe(0) // Should be reset after trigger
    })

    test('respects nextTriggerDate and does not trigger review if date is in future', async () => {
      // Set nextTriggerDate to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: DEPOSIT_AMOUNT_THRESHOLD + 100, // Well above threshold
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: [],
        nextTriggerDate: tomorrow.toISOString()
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      // Make a deposit
      const action = updateDepositAmount(50)
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      // Verify review was NOT requested
      expect(mockRequestReview).not.toHaveBeenCalled()

      // Verify data was saved with accumulated amount
      expect(mockDisklet.setText).toHaveBeenCalledTimes(1)
      const savedJsonData = mockDisklet.setText.mock.calls[0][1] as string
      const savedData = JSON.parse(savedJsonData)
      expect(savedData.depositAmountUsd).toBe(DEPOSIT_AMOUNT_THRESHOLD + 150) // Continues accumulating
    })

    test('handles empty or corrupt data file gracefully', async () => {
      // Mock the disklet to throw an error (simulating missing file)
      mockDisklet.getText.mockRejectedValueOnce(new Error('File not found') as never)

      const action = updateDepositAmount(100)
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      // Verify new data was initialized and saved with the deposit amount
      const savedJsonData = mockDisklet.setText.mock.calls[0][1] as string
      const savedData = JSON.parse(savedJsonData)
      expect(savedData.depositAmountUsd).toBe(100)
      expect(savedData.swapCount).toBe(0)
    })
  })

  describe('updateTransactionCount', () => {
    test('triggers when transaction count reaches threshold', async () => {
      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: TRANSACTION_COUNT_THRESHOLD - 1,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      const action = updateTransactionCount()
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      expect(mockRequestReview).toHaveBeenCalledTimes(1)
      const saved = JSON.parse(mockDisklet.setText.mock.calls[0][1] as string)
      expect(saved.transactionCount).toBe(0)
    })
  })

  describe('updateFiatPurchaseCount', () => {
    test('triggers when fiat purchase count reaches threshold', async () => {
      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: FIAT_PURCHASE_COUNT_THRESHOLD - 1,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      const action = updateFiatPurchaseCount()
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      expect(mockRequestReview).toHaveBeenCalledTimes(1)
      const saved = JSON.parse(mockDisklet.setText.mock.calls[0][1] as string)
      expect(saved.fiatPurchaseCount).toBe(0)
    })
  })

  describe('account upgrade flow', () => {
    test('marks account upgraded', async () => {
      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: false,
        daysSinceUpgrade: []
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      const action = markAccountUpgraded()
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      const saved = JSON.parse(mockDisklet.setText.mock.calls[0][1] as string)
      expect(saved.accountUpgraded).toBe(true)
      expect(saved.daysSinceUpgrade.length).toBe(0)
    })

    test('tracks days after upgrade and triggers after threshold', async () => {
      jest.useFakeTimers()
      const baseDate = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(baseDate)

      const mockData: ReviewTriggerData = {
        swapCount: 0,
        depositAmountUsd: 0,
        transactionCount: 0,
        fiatPurchaseCount: 0,
        accountUpgraded: true,
        daysSinceUpgrade: ['2022-12-30', '2022-12-31']
      }
      mockDisklet.getText.mockResolvedValueOnce(JSON.stringify(mockData))

      const action = trackAppUsageAfterUpgrade()
      const getState: GetState = () => ({ core: { account: mockAccount } })
      await action(mockDispatch, getState)

      expect(mockRequestReview).toHaveBeenCalledTimes(1)
      const saved = JSON.parse(mockDisklet.setText.mock.calls[0][1] as string)
      expect(saved.daysSinceUpgrade.length).toBe(0)

      jest.useRealTimers()
    })
  })
})
