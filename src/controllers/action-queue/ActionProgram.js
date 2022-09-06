// @flow

import { type ActionOp, type ActionProgram } from './types'

export async function makeActionProgram(actionOp: ActionOp, id?: string): Promise<ActionProgram> {
  const programId = Date.now().toString() + (id ?? '')

  return {
    programId,
    actionOp
  }
}
