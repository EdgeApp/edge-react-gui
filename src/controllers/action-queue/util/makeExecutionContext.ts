import { EdgeAccount } from 'edge-core-js'

import { Dispatch, GetState } from '../../../types/reduxTypes'
import { checkActionEffect } from '../runtime/checkActionEffect'
import { evaluateAction } from '../runtime/evaluateAction'
import { checkActionEffect as mockCheckActionEffect } from '../runtime/mock/checkActionEffect'
import { evaluateAction as mockEvaluateAction } from '../runtime/mock/evaluateAction'
import { ExecutionContext } from '../types'

export interface ExecutionContextProperties {
  account: EdgeAccount
  clientId: string
  dispatch: Dispatch
  getState: GetState
}

export const makeExecutionContext = (properties: ExecutionContextProperties, mockMode: boolean = false): ExecutionContext => {
  const out: ExecutionContext = {
    ...properties,
    async evaluateAction(program, state) {
      if (mockMode) return await mockEvaluateAction(out, program, state)
      return await evaluateAction(out, program, state)
    },
    async checkActionEffect(effect) {
      if (mockMode) return await mockCheckActionEffect(out, effect)
      return await checkActionEffect(out, effect)
    }
  }
  return out
}
