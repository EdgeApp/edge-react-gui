import { EdgeAccount, EdgeCurrencyWallet, EdgeNetworkFee, EdgeTransaction } from 'edge-core-js'

import { filterNull } from '../../util/safeFilters'
import { snooze } from '../../util/utils'
import { ActionEffect, ActionProgram, ActionProgramState, BroadcastTx, ExecutableAction, ExecutionOutput, ExecutionResults, PendingTxMap } from './types'

export const mockActionProgram = async (account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  // Await Effect
  while (true) {
    if (effect == null) break

    const { isEffective, delay } = await checkActionEffect(account, effect)

    // Break out of effect check loop if the ActionEffect passes the check
    if (isEffective) break

    // Delay next check
    await snooze(delay)
  }

  // Execute Action
  const executableAction = await evaluateAction(account, program, state, {})
  const output = await executableAction.execute()
  const { effect: nextEffect } = output

  // Return results
  return {
    nextState: { ...state, effect: nextEffect }
  }
}

async function checkActionEffect(account: EdgeAccount, effect: ActionEffect): Promise<{ isEffective: boolean; delay: number }> {
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while running check. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

  switch (effect.type) {
    case 'seq': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Only check the child effect at the current opIndex
      const childEffect = checkedEffects[effect.opIndex]
      return await checkActionEffect(account, childEffect)
    }
    case 'par': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      const promises = checkedEffects.map(async (childEffect, index) => {
        return await checkActionEffect(account, childEffect)
      })
      return {
        delay: 0,
        isEffective: (await Promise.all(promises)).every(yes => yes)
      }
    }
    case 'address-balance': {
      const { address } = effect
      const timestamp = parseInt(address)

      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
      }
    }
    case 'push-event': {
      const { eventId } = effect
      const timestamp = parseInt(eventId)
      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
      }
    }
    case 'price-level': {
      // TODO: Implement
      throw new Error('No implementation for price effect')
    }
    case 'tx-confs': {
      const { txId } = effect
      const timestamp = parseInt(txId)
      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
      }
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return {
        delay: 0,
        isEffective: true
      }
    }
  }
}

async function evaluateAction(account: EdgeAccount, program: ActionProgram, state: ActionProgramState, pendingTxMap: PendingTxMap): Promise<ExecutableAction> {
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
      const childExecutableAction = await evaluateAction(account, nextProgram, state, pendingTxMap)

      return {
        dryrun: async () => {
          const childOutput: ExecutionOutput | null = await childExecutableAction.dryrun()
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
          const effect = output.effect
          return {
            effect: {
              type: 'seq',
              opIndex: nextOpIndex,
              childEffects: [...prevChildEffects, effect]
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
        return await evaluateAction(account, subProgram, state, pendingTxMap)
      })
      const childExecutableActions = await Promise.all(promises)

      return {
        dryrun: async () => {
          const childOutputs = await Promise.all(childExecutableActions.map(async executableAciton => await executableAciton.dryrun()))
          const childEffects: Array<ActionEffect | null> = childOutputs.reduce(
            (effects: Array<ActionEffect | null>, output) => [...effects, output?.effect ?? null],
            []
          )
          return {
            effect: {
              type: 'par',
              childEffects
            },
            broadcastTxs: childOutputs.reduce((broadcastTxs: BroadcastTx[], output) => [...broadcastTxs, ...(output?.broadcastTxs ?? [])], [])
          }
        },
        execute: async () => {
          const outputs = await Promise.all(childExecutableActions.map(async output => await output.execute()))
          const effects = outputs.reduce((effects: ActionEffect[], output) => [...effects, output.effect], [])
          return {
            effect: {
              type: 'par',
              childEffects: effects
            },
            broadcastTxs: outputs.reduce((broadcastTxs: BroadcastTx[], output) => [...broadcastTxs, ...(output.broadcastTxs ?? [])], [])
          }
        }
      }
    }

    case 'wyre-sell': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'tx-confs',
            txId: mockDelayTimestamp(3000, 5000),
            walletId: walletId,
            confirmations: 1
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }

    case 'loan-borrow': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'tx-confs',
            txId: mockDelayTimestamp(2000, 5000),
            walletId: walletId,
            confirmations: 1
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }
    case 'loan-deposit': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'tx-confs',
            txId: mockDelayTimestamp(3000, 5000),
            walletId: walletId,
            confirmations: 1
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }
    case 'loan-repay': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'tx-confs',
            txId: mockDelayTimestamp(2000, 5000),
            walletId: walletId,
            confirmations: 1
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }
    case 'loan-withdraw': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'tx-confs',
            txId: mockDelayTimestamp(3000, 5000),
            walletId: walletId,
            confirmations: 1
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }
    case 'swap': {
      const { toWalletId, toTokenId, fromWalletId: walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return mockExecutableAction(account, (): ExecutionOutput => {
        return {
          effect: {
            type: 'address-balance',
            address: mockDelayTimestamp(5000, 10000),
            walletId: toWalletId,
            tokenId: toTokenId
          },
          broadcastTxs: mockBroadcastTxs(wallet)
        }
      })
    }

    case 'broadcast-tx': {
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }
    case 'wyre-buy': {
      throw new Error(`No implementation for action type ${actionOp.type}`)
    }
  }
}

async function mockExecutableAction(account: EdgeAccount, fn: () => ExecutionOutput): Promise<ExecutableAction> {
  return {
    dryrun: async () => fn(),
    execute: async () => {
      return fn()
    }
  }
}

function mockBroadcastTxs(wallet: EdgeCurrencyWallet): BroadcastTx[] {
  return [
    {
      walletId: wallet.id,
      networkFee: mockNetworkFee(wallet.currencyConfig.currencyInfo.currencyCode),
      tx: mockTx()
    }
  ]
}

function mockDelayTimestamp(min: number, max: number): string {
  const delay = Math.floor((max - min) * Math.random()) + min
  return (Date.now() + delay).toString()
}

function mockNetworkFee(currencyCode: string): EdgeNetworkFee {
  return {
    currencyCode,
    nativeAmount: (Math.random() * 10000000).toString()
  }
}

function mockTx(): EdgeTransaction {
  const tx: any = {}
  return tx
}
