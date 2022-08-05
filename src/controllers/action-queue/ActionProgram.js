// @flow

import { type ActionOp, type ActionProgram } from './types'

export async function makeActionProgram(actionOp: ActionOp): Promise<ActionProgram> {
  const programId = Date.now().toString()

  return {
    programId,
    actionOp
  }
}
