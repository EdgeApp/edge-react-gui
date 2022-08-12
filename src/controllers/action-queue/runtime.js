// @flow

import { add, gt, lt } from 'biggystring'
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { AirshipToast } from '../../components/common/AirshipToast'
import { Airship } from '../../components/services/AirshipInstance'
import { type ApprovableAction } from '../../plugins/borrow-plugins/types'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { filterNull } from '../../util/safeFilters'
import { snooze } from '../../util/utils'
import {
  type ActionEffect,
  type ActionProgram,
  type ActionProgramState,
  type BroadcastTx,
  type ExecutableAction,
  type ExecutionOutput,
  type ExecutionResults
} from './types'

// TODO: Set the status of executing steps accurately
export const executeActionProgram = async (account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  // TODO: dry-run program

  // Await Effect
  let checkErrors: Error[] = []
  while (true) {
    if (effect == null) break

    try {
      const isEffective = await checkActionEffect(account, effect)

      // Reset error aggregation (and failure count)
      checkErrors = []

      // Break out of effect check loop if the ActionEffect passes the check
      if (isEffective) break
    } catch (err) {
      checkErrors.push(err)

      if (checkErrors.length >= 5) {
        const messages = checkErrors.map(e => e.message).join('\n\t')
        throw new Error(`Action effect check failed:\n\t${messages}`)
      }
    }

    await delayForEffect(effect)
  }

  // Execute Action
  const executableAction = await evaluateAction(account, program, state)
  const output = await executableAction.execute()
  const { effect: nextEffect } = output

  // Return results
  return {
    nextState: { ...state, effect: nextEffect }
  }
}

export async function dryrunActionProgram(
  account: EdgeAccount,
  program: ActionProgram,
  state: ActionProgramState,
  shortCircuit: boolean
): Promise<ExecutionOutput[]> {
  const outputs: ExecutionOutput[] = []
  const simulatedState = { ...state }
  while (true) {
    const { dryrunOutput } = await evaluateAction(account, program, simulatedState)

    // In order to avoid infinite loops, we must break when we reach the end
    // of the program or detect that the last effect in sequence is null, which
    // means the last action is not "dry-runnable".

    // Exit if we detect a null at the top-level of the dryrunOutput because
    // this means we evaluated a single-action program which does not support
    // dryrun.
    if (dryrunOutput == null) break

    // Short-circuit if we detect any `null` effect in our dryrunOutput which
    // means some action in the execution path failed to dryrun.
    if (shortCircuit && checkEffectForNull(dryrunOutput.effect)) break

    // Add dryrunOutput to array
    outputs.push(dryrunOutput)
    // Update simulated state for next iteration
    simulatedState.effect = dryrunOutput.effect

    // End of the program
    if (dryrunOutput.effect.type === 'done') break
  }
  return outputs
}

async function checkActionEffect(account: EdgeAccount, effect: ActionEffect): Promise<boolean> {
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexepected null effect while running check. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

  switch (effect.type) {
    case 'seq': {
      if (effect.childEffect === null) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
      return await checkActionEffect(account, effect.childEffect)
    }
    case 'par': {
      const checkedEffects = filterNull(effect.childEffects)

      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      const promises = checkedEffects.map(async (childEffect, index) => {
        return await checkActionEffect(account, childEffect)
      })
      return (await Promise.all(promises)).every(yes => yes)
    }
    case 'address-balance': {
      // TODO: Use effect.address when we can check address balances
      const { aboveAmount, belowAmount, tokenId, walletId } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      const walletBalance = wallet.balances[currencyCode] ?? '0'

      return (aboveAmount != null && gt(walletBalance, aboveAmount)) || (belowAmount != null && lt(walletBalance, belowAmount))
    }
    case 'tx-confs': {
      const { txId, walletId, confirmations } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)

      // Get transaction
      const txs = await wallet.getTransactions({
        // TODO: Add a parameter to limit to one transaction in result
        searchString: txId
      })

      // If not transaction is found with the effect's txId, then we can assume
      // that we're waiting to synchronize with network state.
      if (txs.length === 0) return false

      const tx = txs[0]

      if (tx.confirmations === 'dropped') throw new Error('Transaction was dropped')

      if (typeof tx.confirmations === 'number') {
        return tx.confirmations >= confirmations
      } else {
        return confirmations === 0 || (confirmations > 0 && tx.confirmations === 'confirmed')
      }
    }
    case 'price-level': {
      // TODO: Implement
      throw new Error('No implementation for price effect')
    }
    case 'unixtime': {
      return Date.now() >= effect.timestamp
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return true
    }
    case 'noop': {
      return true
    }
    default:
      throw new Error(`No implementation for effect type ${effect.type}`)
  }
}

function checkEffectForNull(effect: ActionEffect): boolean {
  if (effect.type === 'seq') return effect.childEffect === null
  if (effect.type === 'par') return effect.childEffects.some(effect => effect === null || checkEffectForNull(effect))
  return false
}

/**
 * Evaluates an ActionProgram against an ActionProgramState and returns the
 * an ExecutableAction that can be introspected for dry-run output and executed
 * to get the effect for the next ActionProgramState.
 *
 * The purpose for an ExecutableAction interface is to impose that the developer
 * considers the dry-run output implementation before the execute implementation
 * where it is possible. Sometimes the dry-run output is not possible to
 * to implement for a particular ActionOp type, so the developer should be
 * explicit about this by setting the dryrunOutput to null. A dryrunOutput with
 * a insignificant effect (noop) and/or an empty broadcastTxs array should not
 * be valid except for some special cases which must be specified by the
 * developer (via comments).
 */
async function evaluateAction(account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutableAction> {
  const { actionOp } = program
  const { effect } = state

  switch (actionOp.type) {
    case 'seq': {
      const opIndex = effect != null && effect.type === 'seq' ? effect.opIndex + 1 : 0
      // Handle done case
      if (opIndex > actionOp.actions.length - 1) {
        return {
          dryrunOutput: {
            effect: { type: 'done' },
            broadcastTxs: []
          },
          execute: async () => ({
            effect: { type: 'done' },
            broadcastTxs: []
          })
        }
      }
      const nextProgram = {
        programId: `${program.programId}[${opIndex}]`,
        actionOp: actionOp.actions[opIndex]
      }
      const childOutput = await evaluateAction(account, nextProgram, state)
      const childDryrun: ExecutionOutput | null = childOutput.dryrunOutput
      const childEffect: ActionEffect | null = childDryrun != null ? childDryrun.effect : null
      const childBroadcastTxs: BroadcastTx[] = childDryrun != null ? childDryrun.broadcastTxs : []

      return {
        dryrunOutput: {
          effect: {
            type: 'seq',
            opIndex,
            childEffect: childEffect
          },
          broadcastTxs: childBroadcastTxs
        },
        execute: async () => {
          const output = await childOutput.execute()
          return {
            effect: {
              type: 'seq',
              opIndex,
              childEffect: output.effect
            },
            broadcastTxs: output.broadcastTxs
          }
        }
      }
    }

    case 'par': {
      const promises = actionOp.actions.map(async (actionOp, index) => {
        const programId = `${program.programId}(${index})`
        const subProgram: ActionProgram = { programId, actionOp }
        return await evaluateAction(account, subProgram, state)
      })
      const childOutputs = await Promise.all(promises)
      const childEffects: Array<ActionEffect | null> = childOutputs.reduce((effects, output) => [...effects, output.dryrunOutput.effect], [])

      return {
        dryrunOutput: {
          effect: {
            type: 'par',
            childEffects
          },
          broadcastTxs: childOutputs.reduce((broadcastTxs, output) => [...broadcastTxs, ...output.dryrun.broadcastTxs], [])
        },
        execute: async () => {
          const outputs = await Promise.all(childOutputs.map(async output => await output.execute()))
          const effects = outputs.reduce((effects, output) => [...effects, output.effect], [])
          return {
            effect: {
              type: 'par',
              childEffects: effects
            },
            broadcastTxs: outputs.reduce((broadcastTxs, output) => [...broadcastTxs, ...output.dryrun.broadcastTxs], [])
          }
        }
      }
    }

    case 'loan-borrow': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.borrow({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-deposit': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.deposit({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-repay': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.repay({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-withdraw': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.withdraw({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'swap': {
      const { fromTokenId, fromWalletId, nativeAmount, toTokenId, toWalletId } = actionOp

      const fromWallet = await account.waitForCurrencyWallet(fromWalletId)
      if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

      const toWallet = await account.waitForCurrencyWallet(toWalletId)
      if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

      const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
      const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

      const swapQuote = await account.fetchSwapQuote({
        fromWallet,
        toWallet,
        fromCurrencyCode,
        toCurrencyCode,
        nativeAmount,
        quoteFor: 'from'
      })

      const execute = async () => {
        const swapResult = await swapQuote.approve()
        const { transaction } = swapResult

        // TOOD: Enable this when we can query wallet address balances
        if (swapResult.destinationAddress) {
          // const currentAddressBalance = (await toWallet.getReceiveAddress({ currencyCode: toCurrencyCode })).nativeAmount
          // const aboveAmount = add(currentAddressBalance, swapQuote.toNativeAmount)
          // return {
          //   type: 'balance',
          //   address: swapResult.destinationAddress,
          //   aboveAmount,
          //   walletId: toWalletId,
          //   tokenId: toTokenId
          // }
        }

        // Fallback to wallet balance:
        const walletBalance = toWallet.balances[toCurrencyCode] ?? '0'
        const aboveAmount = add(walletBalance, swapQuote.toNativeAmount)

        const broadcastTxs: BroadcastTx[] = [
          {
            walletId: fromWalletId,
            networkFee: swapQuote.networkFee,
            tx: transaction
          }
        ]

        return {
          effect: {
            type: 'address-balance',
            address: '',
            aboveAmount,
            walletId: toWalletId,
            tokenId: toTokenId
          },
          broadcastTxs
        }
      }
      return {
        dryrunOutput: null, // Support dryrun when EdgeSwapQuote returns a signed tx
        execute
      }
    }

    case 'toast': {
      const execute = async () => {
        Airship.show(bridge => <AirshipToast bridge={bridge} message={actionOp.message} />)
        return {
          effect: { type: 'noop' },
          broadcastTxs: []
        }
      }
      return {
        dryrunOutput: null,
        execute
      }
    }

    case 'delay': {
      const execute = async () => ({
        effect: { type: 'unixtime', timestamp: Date.now() + actionOp.ms },
        broadcastTxs: []
      })
      return {
        dryrunOutput: await execute(),
        execute
      }
    }

    default:
      throw new Error(`No implementation for action type ${actionOp.type} at ${program.programId}`)
  }
}

async function approvableActionToExecutableAction(approvableAction: ApprovableAction): Promise<ExecutableAction> {
  // Execute:
  const execute = async () => {
    const broadcastTxs = await approvableAction.approve()
    const broadcastTx = broadcastTxs[broadcastTxs.length - 1]
    return {
      effect: {
        type: 'tx-confs',
        txId: broadcastTx.tx.txid,
        walletId: broadcastTx.walletId,
        confirmations: 1
      },
      broadcastTxs
    }
  }

  // Dryrun:
  const broadcastTxs = await approvableAction.dryrun()
  const broadcastTx = broadcastTxs[broadcastTxs.length - 1]
  const dryrun = {
    effect: {
      type: 'tx-confs',
      txId: broadcastTx.tx.txid,
      walletId: broadcastTx.walletId,
      confirmations: 1
    },
    broadcastTxs
  }

  return {
    dryrunOutput: dryrun,
    execute
  }
}

async function delayForEffect(effect: ActionEffect): Promise<void> {
  const ms = (() => {
    switch (effect.type) {
      case 'address-balance':
        return 15000
      case 'tx-confs':
        return 6000
      case 'price-level':
        return 30000
      case 'unixtime':
        return 300
      default:
        return 0
    }
  })()
  await snooze(ms)
}
