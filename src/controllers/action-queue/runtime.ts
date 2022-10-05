import { add, gte, lte } from 'biggystring'

// @ts-expect-error
import ENV from '../../../env'
import { ApprovableAction } from '../../plugins/borrow-plugins/types'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { exhaustiveCheck } from '../../util/exhaustiveCheck'
import { filterNull } from '../../util/safeFilters'
import { checkPushEvent, effectCanBeATrigger, prepareNewPushEvents, uploadPushEvents } from './push'
import {
  ActionEffect,
  ActionProgram,
  ActionProgramState,
  BroadcastTx,
  ExecutableAction,
  ExecutionContext,
  ExecutionOutput,
  ExecutionResults,
  PendingTxMap,
  SeqEffect
} from './types'
import { makeWyreClient } from './WyreClient'

export const executeActionProgram = async (context: ExecutionContext, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  //
  // Dryrun Phase
  //

  if (ENV.ACTION_QUEUE?.enableDryrun && effect != null && (await effectCanBeATrigger(context, effect))) {
    try {
      const dryrunOutputs = await dryrunActionProgram(context, program, state, true)

      // Convert each dryrun result into an array of push events for the push-server.
      const newPushEvents = await prepareNewPushEvents(context, program, effect, dryrunOutputs)

      // Send PushEvents to the push server:
      await uploadPushEvents(context, { createEvents: newPushEvents })

      // Mutate the nextState accordingly; effect should be awaiting push events:
      const nextChildEffects = newPushEvents.map(event => ({
        type: 'push-event',
        eventId: event.eventId
      }))
      let nextEffect: ActionEffect
      if (effect.type === 'seq') {
        // Drop the last effect because it is to be replaced by the first push-event effect
        const prevOpIndex = effect.opIndex // Same opIndex because the first of nextChildEffects replaces the last or prevChildEffects
        const prevChildEffects = effect.childEffects.slice(0, -1) // Slice to drop the last of prevChildEffects
        nextEffect = {
          type: 'seq',
          opIndex: prevOpIndex,
          // @ts-expect-error
          childEffects: [...prevChildEffects, ...nextChildEffects]
        }
      } else {
        if (nextChildEffects.length > 1) throw new Error('Unexpected push events length for non-seq/par program')
        // @ts-expect-error
        nextEffect = nextChildEffects[0]
      }

      // Exit early with dryrun results:
      return { nextState: { ...state, effect: nextEffect } }
    } catch (error: any) {
      // Silently fail dryrun
      console.error(error)
    }
  }

  //
  // Check Phase
  //

  if (!state.effective && effect != null) {
    let effective = false
    let delay = 0

    try {
      const result = await checkActionEffect(context, effect)
      effective = result.isEffective

      if (!effective) delay = result.delay

      /**
       * Partially Complete Effect Check:
       *
       * SeqEffect introduced the concept of "partially completed effect" (PCE) in
       * order to support tracking the progress of precomputed effects which are
       * delegated to an external execution environment (e.g. push-server).
       * A SeqEffect is partially-completed when it's opIndex is less then the last
       * index of it's childEffects.
       */
      // TODO: Possibly move this logic into checkActionEffect (return {isEffective: false, nextEffect} or similar to indicate an effect is partially complete)
      if (effect.type === 'seq' && effect.opIndex < effect.childEffects.length - 1) {
        // Progress the partially completed effect forward
        const nextEffect: SeqEffect = {
          ...effect,
          opIndex: effect.opIndex + 1
        }
        return {
          nextState: {
            ...state,
            effect: nextEffect,
            effective: false,
            lastExecutionTime: Date.now(),
            nextExecutionTime: Date.now()
          }
        }
      }
    } catch (err: any) {
      console.warn(`Action effect check failed:\n\t${String(err)}`)
      console.error(err)

      // Increase retry delay (min 2 seconds and max 10 minutes)
      const lastDelay = state.nextExecutionTime - state.lastExecutionTime
      delay = Math.min(Math.max(lastDelay * 1.2, 2000, 10 * 60 * 1000))
    }

    // Update the nextExecutionTime with the retryDelay
    return {
      nextState: {
        ...state,
        effective,
        lastExecutionTime: Date.now(),
        nextExecutionTime: Date.now() + delay
      }
    }
  }

  //
  // Execution Phase
  //

  // Execute Action
  const executableAction = await evaluateAction(context, program, state, {})
  const output = await executableAction.execute()
  const { effect: nextEffect } = output
  const isEffectDone = checkEffectIsDone(nextEffect)

  // Return results
  return {
    nextState: {
      ...state,
      effect: nextEffect,
      effective: isEffectDone,
      lastExecutionTime: Date.now(),
      nextExecutionTime: isEffectDone ? -1 : Date.now() // -1 means never
    }
  }
}

export async function dryrunActionProgram(
  context: ExecutionContext,
  program: ActionProgram,
  state: ActionProgramState,
  shortCircuit: boolean
): Promise<ExecutionOutput[]> {
  const pendingTxMap: PendingTxMap = {}
  const outputs: ExecutionOutput[] = []
  const simulatedState = { ...state }
  while (true) {
    const { dryrunOutput } = await evaluateAction(context, program, simulatedState, pendingTxMap)

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
    // Add all txs to pendingTxMap
    dryrunOutput.broadcastTxs.forEach(broadcastTx => {
      const walletId = broadcastTx.walletId
      pendingTxMap[walletId] = [...(pendingTxMap[walletId] ?? []), broadcastTx.tx]
    })

    // End of the program
    if (checkEffectIsDone(dryrunOutput.effect)) break
  }
  return outputs
}

async function checkActionEffect(context: ExecutionContext, effect: ActionEffect): Promise<{ isEffective: boolean; delay: number }> {
  const { account } = context
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while running check. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

  switch (effect.type) {
    case 'seq': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Only check the child effect at the current opIndex
      const childEffect = checkedEffects[effect.opIndex]
      return await checkActionEffect(context, childEffect)
    }
    case 'par': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Check all child effects concurrently
      const promises = checkedEffects.map(async (childEffect, index) => {
        return await checkActionEffect(context, childEffect)
      })
      return {
        delay: 0,
        isEffective: (await Promise.all(promises)).every(yes => yes)
      }
    }
    case 'address-balance': {
      // TODO: Use effect.address when we can check address balances
      const { aboveAmount, belowAmount, tokenId, walletId } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      const walletBalance = wallet.balances[currencyCode] ?? '0'

      return {
        delay: 15000,
        isEffective: (aboveAmount != null && gte(walletBalance, aboveAmount)) || (belowAmount != null && lte(walletBalance, belowAmount))
      }
    }
    case 'push-event': {
      const { eventId } = effect

      return {
        delay: 15000,
        isEffective: await checkPushEvent(context, eventId)
      }
    }
    case 'price-level': {
      // TODO: Implement
      throw new Error('No implementation for price effect')
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
      if (txs.length === 0) {
        return {
          delay: 6000,
          isEffective: false
        }
      }

      const tx = txs[0]

      if (tx.confirmations === 'dropped') throw new Error('Transaction was dropped')

      if (typeof tx.confirmations === 'number') {
        return {
          delay: 6000,
          isEffective: tx.confirmations >= confirmations
        }
      } else {
        return {
          delay: 6000,
          isEffective: confirmations === 0 || (confirmations > 0 && tx.confirmations === 'confirmed')
        }
      }
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return {
        delay: 0,
        isEffective: true
      }
    }
    default: {
      // $ExpectError
      // @ts-expect-error
      throw exhaustiveCheck(effect.type)
    }
  }
}

function checkEffectForNull(effect: ActionEffect): boolean {
  if (effect.type === 'seq' || effect.type === 'par') return effect.childEffects.some(effect => effect === null || checkEffectForNull(effect))
  return false
}

export function checkEffectIsDone(effect?: ActionEffect | null): boolean {
  return (
    effect != null &&
    (effect.type === 'done' ||
      // Future refactor might included nested done effects:
      (effect.type === 'seq' && effect.childEffects.some(effect => checkEffectIsDone(effect))) ||
      (effect.type === 'par' && effect.childEffects.every(effect => checkEffectIsDone(effect))))
  )
}
export function getEffectErrors(effect?: ActionEffect | null): Error[] {
  if (effect != null) {
    if (effect.type === 'done' && effect.error != null) return [effect.error]
    if (effect.type === 'seq' || effect.type === 'par')
      return effect.childEffects.reduce((errors: Error[], effect) => [...errors, ...getEffectErrors(effect)], [])
  }
  return []
}
export function getEffectPushEventIds(effect?: ActionEffect | null): string[] {
  if (effect != null) {
    if (effect.type === 'push-event') return [effect.eventId]
    if (effect.type === 'seq' || effect.type === 'par')
      return effect.childEffects.reduce((eventIds: string[], effect) => [...eventIds, ...getEffectPushEventIds(effect)], [])
  }
  return []
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
async function evaluateAction(
  context: ExecutionContext,
  program: ActionProgram,
  state: ActionProgramState,
  pendingTxMap: PendingTxMap
): Promise<ExecutableAction> {
  const { account } = context
  const { actionOp } = program
  const { effect } = state

  switch (actionOp.type) {
    case 'seq': {
      const nextOpIndex = effect != null && effect.type === 'seq' ? effect.opIndex + 1 : 0
      const prevChildEffects = effect != null && effect.type === 'seq' ? effect.childEffects : []
      // Handle done case
      if (nextOpIndex > actionOp.actions.length - 1) {
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
        programId: `${program.programId}[${nextOpIndex}]`,
        actionOp: actionOp.actions[nextOpIndex]
      }
      const childOutput: ExecutableAction = await evaluateAction(context, nextProgram, state, pendingTxMap)
      const childDryrun: ExecutionOutput | null = childOutput.dryrunOutput
      const childEffect: ActionEffect | null = childDryrun != null ? childDryrun.effect : null
      const childBroadcastTxs: BroadcastTx[] = childDryrun != null ? childDryrun.broadcastTxs : []

      return {
        dryrunOutput: {
          effect: {
            type: 'seq',
            opIndex: nextOpIndex,
            childEffects: [...prevChildEffects, childEffect]
          },
          broadcastTxs: childBroadcastTxs
        },
        execute: async () => {
          const output = await childOutput.execute()
          const childEffect = output.effect
          return {
            effect: {
              type: 'seq',
              opIndex: nextOpIndex,
              childEffects: [...prevChildEffects, childEffect]
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
        return await evaluateAction(context, subProgram, state, pendingTxMap)
      })
      const childOutputs = await Promise.all(promises)
      // @ts-expect-error
      const childEffects: Array<ActionEffect | null> = childOutputs.reduce((effects, output) => [...effects, output.dryrunOutput.effect], [])

      return {
        dryrunOutput: {
          effect: {
            type: 'par',
            childEffects
          },
          // @ts-expect-error
          broadcastTxs: childOutputs.reduce((broadcastTxs, output) => [...broadcastTxs, ...output.dryrun.broadcastTxs], [])
        },
        // @ts-expect-error
        execute: async () => {
          const outputs = await Promise.all(childOutputs.map(async output => await output.execute()))
          // @ts-expect-error
          const effects = outputs.reduce((effects, output) => [...effects, output.effect], [])
          return {
            effect: {
              type: 'par',
              childEffects: effects
            },
            // @ts-expect-error
            broadcastTxs: outputs.reduce((broadcastTxs, output) => [...broadcastTxs, ...output.dryrun.broadcastTxs], [])
          }
        }
      }
    }

    case 'wyre-sell': {
      const { wyreAccountId, nativeAmount, tokenId, walletId } = actionOp
      const wallet = account.currencyWallets[walletId]
      const currencyCode = getCurrencyCode(wallet, tokenId)

      const wyreClient = await makeWyreClient({
        account
      })

      const paymentAddress = await wyreClient.getCryptoPaymentAddress(wyreAccountId, walletId)

      const makeExecutionOutput = async (dryrun: boolean): Promise<ExecutionOutput> => {
        const unsignedTx = await wallet.makeSpend({
          currencyCode,
          skipChecks: dryrun,
          spendTargets: [
            {
              nativeAmount,
              publicAddress: paymentAddress
            }
          ]
        })
        const signedTx = await wallet.signTx(unsignedTx)
        const networkFee = {
          currencyCode: wallet.currencyInfo.currencyCode,
          nativeAmount: signedTx.parentNetworkFee ?? signedTx.networkFee ?? '0'
        }
        return {
          effect: {
            type: 'tx-confs',
            txId: signedTx.txid,
            walletId,
            confirmations: 1
          },
          broadcastTxs: [
            {
              walletId: walletId,
              networkFee,
              tx: signedTx
            }
          ]
        }
      }

      return makeExecutableAction(context, makeExecutionOutput)
    }

    case 'loan-borrow': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get any pending txs for this wallet
      const pendingTxs = pendingTxMap[walletId] ?? []

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.borrow({ nativeAmount, tokenId, pendingTxs })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-deposit': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get any pending txs for this wallet
      const pendingTxs = pendingTxMap[walletId] ?? []

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.deposit({ nativeAmount, tokenId, pendingTxs })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-repay': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get any pending txs for this wallet
      const pendingTxs = pendingTxMap[walletId] ?? []

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.repay({ nativeAmount, tokenId, pendingTxs })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'loan-withdraw': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get any pending txs for this wallet
      const pendingTxs = pendingTxMap[walletId] ?? []

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.withdraw({ nativeAmount, tokenId, pendingTxs })

      return await approvableActionToExecutableAction(approvableAction)
    }
    case 'swap': {
      const { fromTokenId, fromWalletId, nativeAmount, toTokenId, toWalletId, amountFor } = actionOp

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
        quoteFor: amountFor
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
        // @ts-expect-error
        execute
      }
    }

    case 'broadcast-tx': {
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }
    // @ts-expect-error
    case 'done': {
      // @ts-expect-error
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }
    case 'wyre-buy': {
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }

    default: {
      // $ExpectError
      // @ts-expect-error
      throw exhaustiveCheck(actionOp.type)
    }
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
    // @ts-expect-error
    dryrunOutput: dryrun,
    // @ts-expect-error
    execute
  }
}

/**
 * Super hasty generic to make basic ExecutableAction objects from a function
 * which returns a ExecutionOutput. This is a very basic contract between the
 * two interfaces.
 */
async function makeExecutableAction(context: ExecutionContext, fn: (dryrun: boolean) => Promise<ExecutionOutput>): Promise<ExecutableAction> {
  const { account } = context
  const dryrunOutput = await fn(true)
  return {
    dryrunOutput,
    execute: async () => {
      const output = await fn(false)

      await Promise.all(
        output.broadcastTxs.map(async broadcastTx => {
          const wallet = await account.waitForCurrencyWallet(broadcastTx.walletId)
          const { tx } = broadcastTx
          await wallet.broadcastTx(tx)
          await wallet.saveTx(tx)
        })
      )

      return {
        ...output
      }
    }
  }
}
