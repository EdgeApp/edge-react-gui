import { EdgeAccount } from 'edge-core-js'

import { checkActionEffect } from '../runtime/checkActionEffect'
import { evaluateAction } from '../runtime/evaluateAction'
import { ExecutionContext } from '../types'

export const makeExecutionContext = (properties: { account: EdgeAccount; clientId: string }): ExecutionContext => {
  const out: ExecutionContext = {
    ...properties,
    async evaluateAction(program, state) {
      return evaluateAction(out, program, state)
    },
    async checkActionEffect(effect) {
      return checkActionEffect(out, effect)
    }
  }
  return out
}
