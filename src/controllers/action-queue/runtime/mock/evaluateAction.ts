import { EdgeCurrencyWallet, EdgeNetworkFee, EdgeTransaction } from 'edge-core-js'

import { ActionEffect, ActionProgram, ActionProgramState, BroadcastTx, ExecutableAction, ExecutionContext, ExecutionOutput } from '../../types'

export async function evaluateAction(context: ExecutionContext, program: ActionProgram, state: ActionProgramState): Promise<ExecutableAction> {
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
      const childExecutableAction = await evaluateAction(context, nextProgram, state)

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
        return await evaluateAction(context, subProgram, state)
      })
      const childExecutableActions = await Promise.all(promises)

      return {
        dryrun: async pendingTxMap => {
          const childOutputs = await Promise.all(childExecutableActions.map(async executableAciton => await executableAciton.dryrun(pendingTxMap)))
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

    case 'wyre-buy': {
      throw new Error(`Using obsolete wyre-buy action`)
    }
    case 'wyre-sell': {
      throw new Error(`Using obsolete wyre-sell action`)
    }

    case 'loan-borrow': {
      const { walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)

      return await mockExecutableAction(context, (): ExecutionOutput => {
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

      return await mockExecutableAction(context, (): ExecutionOutput => {
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

      return await mockExecutableAction(context, (): ExecutionOutput => {
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

      return await mockExecutableAction(context, (): ExecutionOutput => {
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

      return await mockExecutableAction(context, (): ExecutionOutput => {
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
  }
}

async function mockExecutableAction(_context: ExecutionContext, fn: () => ExecutionOutput): Promise<ExecutableAction> {
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
