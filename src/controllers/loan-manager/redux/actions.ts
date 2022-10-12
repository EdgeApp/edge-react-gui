import { EdgeAccount } from 'edge-core-js'

import { BorrowPlugin } from '../../../plugins/borrow-plugins/types'
import { Dispatch, GetState } from '../../../types/reduxTypes'
import { makeCleanStore } from '../../../util/CleanStore'
import { scheduleActionProgram } from '../../action-queue/redux/actions'
import { ActionProgram } from '../../action-queue/types'
import { borrowPluginMap } from '../borrowPluginConfig'
import { asLoanAccountMapRecord, LOAN_ACCOUNT_MAP, LOAN_MANAGER_STORE_ID, LoanAccountEntry, LoanProgramEdge, LoanProgramType } from '../store'
import { LoanAccount } from '../types'
import { checkLoanHasFunds } from '../util/checkLoanHasFunds'

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
export const createLoanAccount = (loanAccount: LoanAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account: EdgeAccount = state.core.account
  const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
  const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

  if (loanAccountMapRecord.data[loanAccount.id] == null) {
    const { borrowPlugin, borrowEngine, closed, programEdges } = loanAccount
    const loanEntry: LoanAccountEntry = {
      closed,
      walletId: borrowEngine.currencyWallet.id,
      borrowPluginId: borrowPlugin.borrowInfo.borrowPluginId,
      programEdges
    }

    loanAccountMapRecord.update({ ...loanAccountMapRecord.data, [loanAccount.id]: loanEntry })
  } else {
    throw new Error('Creating duplicate LoanAccount id: ' + loanAccount.id)
  }

  dispatch({
    type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT',
    loanAccount: loanAccount
  })
}

/**
 * Load all LoanAccounts from disk to the redux store and initializes
 * associated BorrowEngines.
 */
export const loadLoanAccounts = (account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
  const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

  for (const key of Object.keys(loanAccountMapRecord.data)) {
    const loanAccountEntry = loanAccountMapRecord.data[key]
    const { walletId, borrowPluginId, closed, programEdges } = loanAccountEntry
    const wallet = await account.waitForCurrencyWallet(walletId)
    const borrowPlugin = borrowPluginMap[borrowPluginId]
    const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)
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

/**
 * Update an existing LoanAccount.
 * It will throw if specified LoanAccount is not found.
 */
export const updateLoanAccount = (loanAccount: LoanAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account: EdgeAccount = state.core.account
  const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
  const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

  // Create loan if it doesn't exist
  if (loanAccountMapRecord.data[loanAccount.id] == null) {
    dispatch(await createLoanAccount(loanAccount))
    return
  }

  const { closed, programEdges } = loanAccount
  loanAccountMapRecord.data[loanAccount.id].closed = closed
  loanAccountMapRecord.data[loanAccount.id].programEdges = programEdges
  loanAccountMapRecord.update(loanAccountMapRecord.data)

  dispatch({
    type: 'LOAN_MANAGER/SET_LOAN_ACCOUNT',
    loanAccount: loanAccount
  })
}

/**
 * Delete an existing LoanAccount.
 * It will throw if specified LoanAccount is not found.
 */
export const deleteLoanAccount = (loanAccountOrId: LoanAccount | string) => async (dispatch: Dispatch, getState: GetState) => {
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

  dispatch({
    type: 'LOAN_MANAGER/DELETE_LOAN_ACCOUNT',
    id: loanAccountId
  })
}

/**
 * Execute action program, and update associated LoanAccount.
 */
export const runLoanActionProgram =
  (loanAccount: LoanAccount, actionProgram: ActionProgram, programType: LoanProgramType) =>
  async (dispatch: Dispatch, getState: GetState): Promise<LoanAccount> => {
    await dispatch(scheduleActionProgram(actionProgram))
    const programEdge: LoanProgramEdge = {
      programId: actionProgram.programId,
      programType
    }
    await dispatch(updateLoanAccount({ ...loanAccount, programEdges: [...loanAccount.programEdges, programEdge] }))

    return loanAccount
  }

export const resyncLoanAccounts = (account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const store = makeCleanStore(account, LOAN_MANAGER_STORE_ID)
  const loanAccountMapRecord = await store.initRecord(LOAN_ACCOUNT_MAP, asLoanAccountMapRecord)

  const typeHack: any = Object.values(borrowPluginMap)
  const borrowPlugins: BorrowPlugin[] = typeHack

  // `loanAccountIds` is synonymous to `walletIds`
  const ids = Object.keys(account.currencyWallets)

  dispatch({
    type: 'LOAN_MANAGER/SET_SYNC_RATIO',
    syncRatio: 0
  })

  let progress = 0
  const promises = ids
    .map(async (id, i) => {
      const loanAccountId = id
      try {
        const wallet = await account.waitForCurrencyWallet(loanAccountId)

        const currencyPluginId = wallet.currencyConfig.currencyInfo.pluginId
        const borrowPlugin = borrowPlugins.find(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === currencyPluginId)

        if (borrowPlugin == null) return

        const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

        await new Promise(resolve => {
          borrowEngine.watch('syncRatio', syncRatio => {
            // @ts-expect-error
            if (syncRatio >= 1) resolve()
          })
        })

        if (checkLoanHasFunds(borrowEngine)) {
          if (loanAccountMapRecord.data[loanAccountId]) return

          // Create a loan account for the wallet
          const loanAccount: LoanAccount = {
            id: loanAccountId,
            borrowPlugin,
            borrowEngine,
            closed: false,
            programEdges: []
          }
          await dispatch(createLoanAccount(loanAccount))
        } else {
          const existingLoanAccount = loanAccountMapRecord.data[loanAccountId]
          if (existingLoanAccount != null && existingLoanAccount.closed) {
            await dispatch(deleteLoanAccount(loanAccountId))
          }
        }
      } catch (error: any) {
        console.error(error)
      }
    })
    .map(async promise =>
      promise.then(() => {
        const syncRatio = ++progress / ids.length
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
