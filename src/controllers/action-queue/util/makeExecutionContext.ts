import { EdgeAccount } from 'edge-core-js'

import { checkActionEffect as mockCheckActionEffect, evaluateAction as mockEvaluateAction } from '../mock'
import { checkActionEffect } from '../runtime/checkActionEffect'
import { evaluateAction } from '../runtime/evaluateAction'
import { ExecutionContext } from '../types'

export const makeExecutionContext = (properties: { account: EdgeAccount; clientId: string }, mockMode: boolean = false): ExecutionContext => {
  const out: ExecutionContext = {
    ...properties,
    async evaluateAction(program, state) {
      if (mockMode) return mockEvaluateAction(out, program, state)
      return evaluateAction(out, program, state)
    },
    async checkActionEffect(effect) {
      if (mockMode) return mockCheckActionEffect(out, effect)
      return checkActionEffect(out, effect)
    }
  }
  return out
}
