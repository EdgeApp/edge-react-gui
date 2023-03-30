import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { BorrowPlugin } from '../../../plugins/borrow-plugins/types'
import { ThunkAction } from '../../../types/reduxTypes'
import { makeCleanStore } from '../../../util/CleanStore'
import { logActivity } from '../../../util/logger'
import { scheduleActionProgram } from '../../action-queue/redux/actions'
import { ActionProgram } from '../../action-queue/types'
import { borrowPluginMap } from '../borrowPluginConfig'
import { makeLoanAccount } from '../LoanAccount'
import { asLoanAccountMapRecord, LOAN_ACCOUNT_MAP, LOAN_MANAGER_STORE_ID, LoanAccountEntry, LoanProgramEdge, LoanProgramType } from '../store'
import { LoanAccount } from '../types'
import { checkLoanHasFunds } from '../util/checkLoanHasFunds'
import { waitForBorrowEngineSync } from '../util/waitForLoanAccountSync'
import { selectLoanAccount } from './selectors'

interface SetLoanAccountAction {
  type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT'
  loanAccount: LoanAccount
}
interface DeleteLoanAccountAction {
  type: 'LOAN_MANAGER/DELETE_LOAN_ACCOUNT'
  id: string
}
interface UpdateSyncRatio {
  type: 'LOAN_MANAGER/SET_SYNC_RATIO'
  syncRatio: number
}

export type LoanManagerActions = SetLoanAccountAction | DeleteLoanAccountAction | UpdateSyncRatio

/**
 * Returns a loan account selected from the redux store, or creates a new loan
 * account and return it if it doesn't exists.
 */
export function getOrCreateLoanAccount(borrowPlugin: BorrowPlugin, wallet: EdgeCurrencyWallet): ThunkAction<Promise<LoanAccount>> {
  return async (_dispatch, getState) => {
    const state = getState()
    const existingLoanAccount = selectLoanAccount(state, wallet.id)
    if (existingLoanAccount) return existingLoanAccount

    const newLoanAccount = await makeLoanAccount(borrowPlugin, wallet)
    return newLoanAccount
  }
}

/**
 * Save a new LoanAccount to disk and sets it in the Redux state.
 * It will throw if specified LoanAccount exists already.
 */
export function saveLoanAccount(loanAccount: LoanAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const account: EdgeAccount = state.core.account
    const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
    const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)
    const existingLoanAccountEntry = loanAccountMapRecord.data[loanAccount.id]

    // Create loan account if it doesn't exist
    if (existingLoanAccountEntry == null) {
      const { borrowPlugin, borrowEngine, closed, programEdges } = loanAccount
      const loanEntry: LoanAccountEntry = {
        closed,
        walletId: borrowEngine.currencyWallet.id,
        borrowPluginId: borrowPlugin.borrowInfo.borrowPluginId,
        programEdges
      }

      await loanAccountMapRecord.update({ ...loanAccountMapRecord.data, [loanAccount.id]: loanEntry })
    }

    // Update loan account if it does exist
    if (existingLoanAccountEntry != null) {
      const { closed, programEdges } = loanAccount
      loanAccountMapRecord.data[loanAccount.id].closed = closed
      loanAccountMapRecord.data[loanAccount.id].programEdges = programEdges
      await loanAccountMapRecord.update(loanAccountMapRecord.data)
    }

    logActivity(`Create Loan Account`, { loanAccountId: loanAccount.id })

    dispatch({
      type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT',
      loanAccount: loanAccount
    })
  }
}

/**
 * Load all LoanAccounts from disk to the redux store and initializes
 * associated BorrowEngines.
 */
export function loadLoanAccounts(account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
    const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

    for (const key of Object.keys(loanAccountMapRecord.data)) {
      const loanAccountEntry = loanAccountMapRecord.data[key]
      const wallet = await account.waitForCurrencyWallet(loanAccountEntry.walletId)
      const borrowPlugin = borrowPluginMap[loanAccountEntry.borrowPluginId]

      // Instantiate loan account from loanAccountEntry
      const loanAccount = await makeLoanAccount(borrowPlugin, wallet)
      loanAccount.closed = loanAccountEntry.closed
      loanAccount.programEdges = loanAccountEntry.programEdges

      // Start the engine
      await loanAccount.borrowEngine.startEngine()

      // Save the loan account
      dispatch({
        type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT',
        loanAccount
      })
    }
  }
}

/**
 * Delete an existing LoanAccount.
 * It will throw if specified LoanAccount is not found.
 */
export function deleteLoanAccount(loanAccountOrId: LoanAccount | string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const account: EdgeAccount = state.core.account
    const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
    const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

    const loanAccountId = typeof loanAccountOrId === 'string' ? loanAccountOrId : loanAccountOrId.id
    if (loanAccountMapRecord.data[loanAccountId] != null) {
      const { [loanAccountId]: _, ...loanAccountMapRecordUpdated } = loanAccountMapRecord.data
      await loanAccountMapRecord.update(loanAccountMapRecordUpdated)
    } else {
      throw new Error('Could not find LoanAccount id: ' + loanAccountId)
    }

    logActivity(`Delete Loan Account`, { loanAccountId })

    dispatch({
      type: 'LOAN_MANAGER/DELETE_LOAN_ACCOUNT',
      id: loanAccountId
    })
  }
}

/**
 * Execute action program, and update associated LoanAccount.
 */
export function runLoanActionProgram(loanAccount: LoanAccount, actionProgram: ActionProgram, programType: LoanProgramType): ThunkAction<Promise<LoanAccount>> {
  return async dispatch => {
    await dispatch(scheduleActionProgram(actionProgram))
    const programEdge: LoanProgramEdge = {
      programId: actionProgram.programId,
      programType
    }
    await dispatch(saveLoanAccount({ ...loanAccount, programEdges: [...loanAccount.programEdges, programEdge], closed: programType === 'loan-close' }))

    return loanAccount
  }
}

export function resyncLoanAccounts(account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const typeHack: any = Object.values(borrowPluginMap)
    const borrowPlugins: BorrowPlugin[] = typeHack

    const walletIds = account.activeWalletIds

    dispatch({
      type: 'LOAN_MANAGER/SET_SYNC_RATIO',
      syncRatio: 0
    })

    let progress = 0
    for (const walletId of walletIds) {
      const loanAccountId = walletId
      const existingLoanAccount = selectLoanAccount(getState(), loanAccountId)

      try {
        const wallet = await account.waitForCurrencyWallet(loanAccountId)

        const currencyPluginId = wallet.currencyConfig.currencyInfo.pluginId
        const borrowPlugin = borrowPlugins.find(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === currencyPluginId)

        if (borrowPlugin == null) return

        // Create new loan account and save it if it has funds
        if (existingLoanAccount == null) {
          const loanAccount = await makeLoanAccount(borrowPlugin, wallet)
          const borrowEngine = loanAccount.borrowEngine

          // Start engine
          await borrowEngine.startEngine()

          await waitForBorrowEngineSync(borrowEngine)

          if (checkLoanHasFunds(loanAccount)) {
            // Save the new loan account if it has funds
            await dispatch(saveLoanAccount(loanAccount))
          } else {
            // Cleanup the new loan engine if it has no funds
            await borrowEngine.stopEngine()
          }
        }

        // Remove existing loan account if it is fully closed
        if (existingLoanAccount != null) {
          // Create new loan account for wallet if it doesn't exist
          const loanAccount = existingLoanAccount
          const borrowEngine = loanAccount.borrowEngine

          await waitForBorrowEngineSync(borrowEngine) // If it exists in loan manager, it should be started

          if (!checkLoanHasFunds(loanAccount) && existingLoanAccount.closed) {
            // Cleanup and remove loan account if it's marked as closed
            await existingLoanAccount.borrowEngine.stopEngine()
            await dispatch(deleteLoanAccount(loanAccountId))
          }
        }
      } catch (error: any) {
        console.error(error)
      } finally {
        const syncRatio = ++progress / walletIds.length
        dispatch({
          type: 'LOAN_MANAGER/SET_SYNC_RATIO',
          syncRatio
        })
      }
    }

    dispatch({
      type: 'LOAN_MANAGER/SET_SYNC_RATIO',
      syncRatio: 1
    })
  }
}
