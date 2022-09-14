import { add, gt } from 'biggystring'
import { EdgeAccount } from 'edge-core-js'

import { BorrowPlugin } from '../../../plugins/borrow-plugins/types'
import { Dispatch, GetState } from '../../../types/reduxTypes'
import { makeCleanStore } from '../../../util/CleanStore'
import { scheduleActionProgram } from '../../action-queue/redux/actions'
import { ActionProgram } from '../../action-queue/types'
import { borrowPluginMap } from '../borrowPluginConfig'
import { asLoanAccountMapRecord, LOAN_ACCOUNT_MAP, LOAN_MANAGER_STORE_ID, LoanAccountEntry, LoanProgramEdge, LoanProgramType } from '../store'
import { LoanAccount } from '../types'

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
    const { borrowPlugin, borrowEngine, programEdges } = loanAccount
    const loanEntry: LoanAccountEntry = {
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
    const record = loanAccountMapRecord.data[key]
    const { walletId, borrowPluginId, programEdges } = record
    const wallet = await account.waitForCurrencyWallet(walletId)
    const borrowPlugin = borrowPluginMap[borrowPluginId]
    const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)
    const loanAccount: LoanAccount = {
      id: walletId,
      borrowPlugin,
      borrowEngine,
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

  if (loanAccountMapRecord.data[loanAccount.id] == null) {
    throw new Error('Could not find LoanAccount id: ' + loanAccount.id)
  } else {
    const { borrowPlugin, borrowEngine, programEdges } = loanAccount
    const loanEntry: LoanAccountEntry = {
      walletId: borrowEngine.currencyWallet.id,
      borrowPluginId: borrowPlugin.borrowInfo.borrowPluginId,
      programEdges
    }

    loanAccountMapRecord.update({ ...loanAccountMapRecord.data, [loanAccount.id]: loanEntry })
  }

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

        // Find plugin which support currency wallet
        const currencyPluginId = wallet.currencyConfig.currencyInfo.pluginId
        const borrowPlugin = borrowPlugins.find(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === currencyPluginId)

        // Skip wallets that don't have a supported borrow plugin
        if (borrowPlugin == null) return

        // Make borrow engine
        const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

        // Wait for borrow engine to be fully synced
        await new Promise(resolve => {
          borrowEngine.watch('syncRatio', syncRatio => {
            // @ts-expect-error
            if (syncRatio >= 1) resolve()
          })
        })

        const hasDebt = gt(
          borrowEngine.debts.reduce((sum, debt) => add(sum, debt.nativeAmount), '0'),
          '0'
        )
        const hasCollateral = gt(
          borrowEngine.collaterals.reduce((sum, collateral) => add(sum, collateral.nativeAmount), '0'),
          '0'
        )

        if (hasDebt && hasCollateral) {
          // Ignore creating account if already created
          if (loanAccountMapRecord.data[loanAccountId]) return
          // Create loan account if not already created
          const loanAccount: LoanAccount = {
            id: loanAccountId,
            borrowPlugin,
            borrowEngine,
            programEdges: []
          }
          await dispatch(createLoanAccount(loanAccount))
        } else {
          // Remove loans "emptied out" loans
          const existingLoanAccount = loanAccountMapRecord.data[loanAccountId]
          if (existingLoanAccount != null) {
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
