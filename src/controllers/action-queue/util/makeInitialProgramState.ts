import { ActionProgramState } from '../types'

export const makeInitialProgramState = (clientId: string, programId: string): ActionProgramState => {
  return {
    clientId,
    programId,
    effective: false,
    executing: false,
    lastExecutionTime: 0,
    nextExecutionTime: 0
  }
}
