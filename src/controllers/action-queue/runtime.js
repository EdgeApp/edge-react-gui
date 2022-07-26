// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { AirshipToast } from '../../components/common/AirshipToast'
import { Airship } from '../../components/services/AirshipInstance'
import { snooze } from '../../util/utils'
import { type ActionEffect, type ActionProgram, type ActionProgramState, type ExecutionResult, type ExecutionResults } from './types'

export const executeActionProgram = async (account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  // TODO: dry-run program

  // Await Effect
  while (true) {
    if (effect == null) break

    const isEffective = await checkActionEffect(account, effect)
    if (isEffective) break

    await delayForEffect(effect)
  }

  // Execute Action
  const { effect: nextEffect } = await executeActionOp(account, program, state)

  // Return next state
  return {
    nextState: { ...state, effect: nextEffect }
  }
}

async function checkActionEffect(account: EdgeAccount, effect: ActionEffect): Promise<boolean> {
  switch (effect.type) {
    case 'seq': {
      return await checkActionEffect(account, effect.childEffect)
    }
    case 'par': {
      const promises = effect.childEffects.map(async (childEffect, index) => {
        return await checkActionEffect(account, childEffect)
      })
      return (await Promise.all(promises)).every(yes => yes)
    }
    case 'unixtime': {
      return Date.now() >= effect.timestamp
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return true
    }
    default:
      throw new Error(`No implementation for effect type ${effect.type}`)
  }
}

async function executeActionOp(account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResult> {
  const { actionOp } = program
  const { effect } = state

  switch (actionOp.type) {
    case 'seq': {
      const opIndex = effect != null && effect.type === 'seq' ? effect.opIndex + 1 : 0
      // Handle done case
      if (opIndex > actionOp.actions.length - 1) {
        return {
          effect: { type: 'done' }
        }
      }
      const nextProgram = {
        programId: `${program.programId}[${opIndex}]`,
        actionOp: actionOp.actions[opIndex]
      }
      const childResult = await executeActionOp(account, nextProgram, state)
      return {
        effect: {
          type: 'seq',
          opIndex,
          childEffect: childResult.effect
        }
      }
    }
    case 'par': {
      const promises = actionOp.actions.map(async (actionOp, index) => {
        const programId = `${program.programId}(${index})`
        const subProgram: ActionProgram = { programId, actionOp }
        return await executeActionOp(account, subProgram, state)
      })
      const childResults = await Promise.all(promises)
      return {
        effect: {
          type: 'par',
          childEffects: childResults.map(result => result.effect)
        }
      }
    }
    case 'toast': {
      await Airship.show(bridge => <AirshipToast bridge={bridge} message={actionOp.message} />)
      // Delay for 3 seconds because that's how long toasts last
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + 3000 }
      }
    }
    case 'delay': {
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + actionOp.ms }
      }
    }
    default:
      throw new Error(`No implementation for effect type ${actionOp.type} at ${program.programId}`)
  }
}

async function delayForEffect(effect: ActionEffect): Promise<void> {
  const ms = (() => {
    switch (effect.type) {
      case 'unixtime':
        return 300
      default:
        return 0
    }
  })()
  await snooze(ms)
}
