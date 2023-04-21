import { add, mul } from 'biggystring'

import { ApprovableAction, BorrowEngine, BorrowPlugin } from '../../../plugins/borrow-plugins/types'
import { queryBorrowPlugins } from '../../../plugins/helpers/borrowPluginHelpers'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getOrCreateLoanAccount } from '../../loan-manager/redux/actions'
import { waitForBorrowEngineSync } from '../../loan-manager/util/waitForLoanAccountSync'
import { ActionEffect, ActionProgram, ActionProgramState, BroadcastTx, ExecutableAction, ExecutionContext, ExecutionOutput, PendingTxMap } from '../types'

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
export async function evaluateAction(context: ExecutionContext, program: ActionProgram, state: ActionProgramState): Promise<ExecutableAction> {
  const { account, dispatch } = context
  const { actionOp } = program
  const { effect } = state

  switch (actionOp.type) {
    case 'seq': {
      const nextOpIndex = effect != null && effect.type === 'seq' ? effect.opIndex + 1 : 0
      const prevChildEffects = effect != null && effect.type === 'seq' ? effect.childEffects : []
      // Handle done case
      if (nextOpIndex > actionOp.actions.length - 1) {
        return {
          dryrun: async () => ({
            effect: { type: 'done' },
            broadcastTxs: []
          }),
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
      const childExecutableAction: ExecutableAction = await context.evaluateAction(nextProgram, state)

      return {
        dryrun: async pendingTxMap => {
          const childOutput: ExecutionOutput | null = await childExecutableAction.dryrun(pendingTxMap)
          const childEffect: ActionEffect | null = childOutput != null ? childOutput.effect : null
          const childBroadcastTxs: BroadcastTx[] = childOutput != null ? childOutput.broadcastTxs : []

          return {
            effect: {
              type: 'seq',
              opIndex: nextOpIndex,
              childEffects: [...prevChildEffects, childEffect]
            },
            broadcastTxs: childBroadcastTxs
          }
        },
        execute: async () => {
          const output = await childExecutableAction.execute()
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
        return await context.evaluateAction(subProgram, state)
      })
      const childExecutableActions = await Promise.all(promises)

      return {
        dryrun: async pendingTxMap => {
          // Clone because we can't mutate pendingTxMap
          const pendingTxMapLocal: PendingTxMap = { ...pendingTxMap }

          const childOutputs: ExecutionOutput[] = []
          for (const executableAction of childExecutableActions) {
            const output = await executableAction.dryrun(pendingTxMapLocal)
            // Exit early if the child effect cannot be dryrun
            if (output == null) return null
            // Add broadcastTxs to localPendingTxMap to be used in the next iteration of this loop
            for (const broadcastTx of output.broadcastTxs) {
              const walletId = broadcastTx.walletId
              pendingTxMapLocal[walletId] = [...(pendingTxMapLocal[walletId] ?? []), broadcastTx.tx]
            }
            // Add output to childOutputs
            childOutputs.push(output)
          }

          const childEffects = childOutputs.flatMap(output => output.effect)
          const broadcastTxs = childOutputs.flatMap(output => output.broadcastTxs)

          return {
            effect: {
              type: 'par',
              childEffects
            },
            broadcastTxs
          }
        },
        execute: async () => {
          // Execute actions serially in order to make sure transaction state is saved to wallets
          // before continuing to next action. This is important for state like correct nonce or
          // UTXO selection.
          const childOutputs: ExecutionOutput[] = []
          for (const executableAction of childExecutableActions) {
            const output = await executableAction.execute()
            // Add output to childOutputs
            childOutputs.push(output)
          }

          const childEffects = childOutputs.flatMap(output => output.effect)
          const broadcastTxs = childOutputs.flatMap(output => output.broadcastTxs)

          return {
            effect: {
              type: 'par',
              childEffects
            },
            broadcastTxs
          }
        }
      }
    }

    // TODO: Remove once we implement action-queue disk data deletion
    case 'wyre-buy': {
      const makeExecutionOutput = async (): Promise<ExecutionOutput> => {
        console.error(`Using obsolete wyre-buy action`)

        return {
          effect: { type: 'done' },
          broadcastTxs: []
        }
      }

      return await makeExecutableAction(context, makeExecutionOutput)
    }
    // TODO: Remove once we implement action-queue disk data deletion
    case 'wyre-sell': {
      const makeExecutionOutput = async (): Promise<ExecutionOutput> => {
        console.error(`Using obsolete wyre-sell action`)

        return {
          effect: { type: 'done' },
          broadcastTxs: []
        }
      }

      return await makeExecutableAction(context, makeExecutionOutput)
    }

    case 'loan-borrow': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      const borrowPlugin: BorrowPlugin | undefined = queryBorrowPlugins({ borrowPluginId })[0]
      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      const { borrowEngine } = await dispatch(getOrCreateLoanAccount(borrowPlugin, wallet))

      // Do the thing
      const approvableAction = await borrowEngine.borrow({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(borrowEngine, approvableAction)
    }
    case 'loan-deposit': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      const borrowPlugin: BorrowPlugin | undefined = queryBorrowPlugins({ borrowPluginId })[0]
      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      const { borrowEngine } = await dispatch(getOrCreateLoanAccount(borrowPlugin, wallet))

      // Do the thing
      const approvableAction = await borrowEngine.deposit({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(borrowEngine, approvableAction)
    }
    case 'loan-repay': {
      const { borrowPluginId, nativeAmount, walletId, tokenId, fromTokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      const borrowPlugin: BorrowPlugin | undefined = queryBorrowPlugins({ borrowPluginId })[0]
      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      const { borrowEngine } = await dispatch(getOrCreateLoanAccount(borrowPlugin, wallet))

      // Do the thing
      const approvableAction = await borrowEngine.repay({ nativeAmount, tokenId, fromTokenId })

      return await approvableActionToExecutableAction(borrowEngine, approvableAction)
    }
    case 'loan-withdraw': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = await account.waitForCurrencyWallet(walletId)
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      const borrowPlugin: BorrowPlugin | undefined = queryBorrowPlugins({ borrowPluginId })[0]
      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      const { borrowEngine } = await dispatch(getOrCreateLoanAccount(borrowPlugin, wallet))

      // Do the thing
      const approvableAction = await borrowEngine.withdraw({ nativeAmount, tokenId })

      return await approvableActionToExecutableAction(borrowEngine, approvableAction)
    }
    case 'swap': {
      const { fromTokenId, fromWalletId, nativeAmount, expectedPayoutNativeAmount: payoutNativeAmount, toTokenId, toWalletId, amountFor } = actionOp

      const fromWallet = await account.waitForCurrencyWallet(fromWalletId)
      if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

      const toWallet = await account.waitForCurrencyWallet(toWalletId)
      if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

      const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
      const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

      const execute = async (): Promise<ExecutionOutput> => {
        const swapQuote = await account.fetchSwapQuote({
          fromWallet,
          toWallet,
          fromCurrencyCode,
          toCurrencyCode,
          nativeAmount,
          quoteFor: amountFor
        })
        const swapResult = await swapQuote.approve()
        const { transaction } = swapResult
        const { swapData } = transaction

        if (swapData == null) throw new Error(`Expected swapData from EdgeTransaction for swap provider '${swapQuote.pluginId}'`)

        // We can only assume the wallet balance and the address balance are the same for account-based currencies.
        // So we must assert the currency type matches a whitelist of plugins which are account-based.
        // In order to fully implement SwapActionOp, we require a getAddressBalance method on EdgeCurrencyWallet.
        const supportedDestniationPlugins = [
          'binancesmartchain',
          'ethereum',
          'ethereumclassic',
          'ethDev',
          'fantom',
          'goerli',
          'kovan',
          'rinkeby',
          'ropsten',
          'rsk',
          'polygon',
          'celo',
          'avalanche'
        ]
        if (!supportedDestniationPlugins.includes(toWallet.currencyInfo.pluginId))
          throw new Error(`SwapActionOp only implemented for destination wallets for plugins: ${supportedDestniationPlugins.join(', ')}`)

        /*
        // TODO: For UTXO-based currency support, pass the payoutAddress to a
        // wallet method like getReceiveAddress (e.g. getAddressBalance), but
        // specifically for getting an address's balance.
        const currentAddressBalance = (await toWallet.getReceiveAddress({ currencyCode: toCurrencyCode }))?.nativeAmount ?? '0'
        const aboveAmount = add(currentAddressBalance, swapData.payoutNativeAmount)
        */

        // Factor in manually-specified payoutNativeAmount to trigger if this is
        // effective, or add a buffer for margin of error when requesting 'from'
        // quotes since the swap payout amount is not guaranteed.
        const swapPayoutNativeAmount =
          payoutNativeAmount != null ? payoutNativeAmount : amountFor === 'from' ? mul(swapData.payoutNativeAmount, '0.9') : swapData.payoutNativeAmount
        const walletBalance = toWallet.balances[toCurrencyCode] ?? '0'
        const aboveAmount = add(walletBalance, swapPayoutNativeAmount)

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
            address: swapData.payoutAddress,
            aboveAmount,
            walletId: toWalletId,
            tokenId: toTokenId
          },
          broadcastTxs
        }
      }
      return {
        dryrun: async () => null, // Support dryrun when EdgeSwapQuote returns a signed tx
        execute
      }
    }

    case 'broadcast-tx': {
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }
  }
}

async function approvableActionToExecutableAction(borrowEngine: BorrowEngine, approvableAction: ApprovableAction): Promise<ExecutableAction> {
  // Execute:
  const execute = async (): Promise<ExecutionOutput> => {
    await waitForBorrowEngineSync(borrowEngine)

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
  const dryrun = async (pendingTxMap: Readonly<PendingTxMap>): Promise<ExecutionOutput> => {
    const broadcastTxs = await approvableAction.dryrun(pendingTxMap)
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

  return {
    dryrun,
    execute
  }
}

/**
 * Super hasty generic to make basic ExecutableAction objects from a function
 * which returns a ExecutionOutput. This is a very basic contract between the
 * two interfaces.
 */
async function makeExecutableAction(
  context: ExecutionContext,
  fn: (dryrun: boolean, pendingTxMap: Readonly<PendingTxMap>) => Promise<ExecutionOutput>
): Promise<ExecutableAction> {
  const { account } = context
  return {
    dryrun: async pendingTxMap => await fn(true, pendingTxMap),
    execute: async () => {
      const output = await fn(false, {})

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
