import { EdgeAccount } from 'edge-core-js'

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
import { selectLoanAccount } from './selectors'

type SetLoanAccountAction = {
  type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT'
  loanAccount: LoanAccount
}
type DeleteLoanAccountAction = {
  type: 'LOAN_MANAGER/DELETE_LOAN_ACCOUNT'
  id: string
}
type UpdateSyncRatio = {
  type: 'LOAN_MANAGER/SET_SYNC_RATIO'
  syncRatio: number
}

export type LoanManagerActions = SetLoanAccountAction | DeleteLoanAccountAction | UpdateSyncRatio

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

      loanAccountMapRecord.update({ ...loanAccountMapRecord.data, [loanAccount.id]: loanEntry })
    }

    // Update loan account if it does exist
    if (existingLoanAccountEntry != null) {
      const { closed, programEdges } = loanAccount
      loanAccountMapRecord.data[loanAccount.id].closed = closed
      loanAccountMapRecord.data[loanAccount.id].programEdges = programEdges
      loanAccountMapRecord.update(loanAccountMapRecord.data)
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
      const { walletId, borrowPluginId, closed, programEdges } = loanAccountEntry
      const wallet = await account.waitForCurrencyWallet(walletId)
      const borrowPlugin = borrowPluginMap[borrowPluginId]
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)
      await borrowEngine.startEngine()
      const loanAccount: LoanAccount = {
        id: walletId,
        borrowPlugin,
        borrowEngine,
        closed,
        programEdges
      }
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
      loanAccountMapRecord.update(loanAccountMapRecordUpdated)
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
    await dispatch(saveLoanAccount({ ...loanAccount, programEdges: [...loanAccount.programEdges, programEdge] }))

    return loanAccount
  }
}

export function resyncLoanAccounts(account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const typeHack: any = Object.values(borrowPluginMap)
    const borrowPlugins: BorrowPlugin[] = typeHack

    // `loanAccountIds` is synonymous to `walletIds`
    const loanAccountIds = Object.keys(account.currencyWallets)

    dispatch({
      type: 'LOAN_MANAGER/SET_SYNC_RATIO',
      syncRatio: 0
    })

    let progress = 0
    const promises = loanAccountIds
      .map(async (id, i) => {
        const loanAccountId = id
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

            // Wait for engine to fully synced
            await new Promise<void>(resolve => {
              borrowEngine.watch('syncRatio', syncRatio => {
                if (syncRatio >= 1) resolve()
              })
            })

            if (checkLoanHasFunds(borrowEngine)) {
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

            // Wait if engine isn't fully synced
            await new Promise(resolve => {
              borrowEngine.watch('syncRatio', syncRatio => {
                // @ts-expect-error
                if (syncRatio >= 1) resolve()
              })
            })

            if (!checkLoanHasFunds(borrowEngine) && existingLoanAccount.closed) {
              // Cleanup and remove loan account if it's marked as closed
              await existingLoanAccount.borrowEngine.stopEngine()
              await dispatch(deleteLoanAccount(loanAccountId))
            }
          }
        } catch (error: any) {
          console.error(error)
        }
      })
      .map(async promise =>
        promise.then(() => {
          const syncRatio = ++progress / loanAccountIds.length
          // console.log('\n###\n', { total: ids.length, progress, syncRatio }, '\n###\n')
          dispatch({
            type: 'LOAN_MANAGER/SET_SYNC_RATIO',
            syncRatio
          })
        })
      )

    await Promise.all(promises)

    dispatch({
      type: 'LOAN_MANAGER/SET_SYNC_RATIO',
      syncRatio: 1
    })
  }
}
