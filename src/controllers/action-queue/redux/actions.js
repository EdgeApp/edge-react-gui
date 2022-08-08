// @flow

import { type Dispatch, type GetState } from '../../../types/reduxTypes'
import { type ActionQueueStore, makeActionQueueStore } from '../ActionQueueStore'
import { type ActionProgram, type ActionProgramState, type ActionQueueItem, type ActionQueueMap } from '../types'

type LoadActionQueueStateAction = {
  type: 'ACTION_QUEUE/LOAD_QUEUE',
  data: ActionQueueMap
}

type ScheduleProgramAction = {
  type: 'ACTION_QUEUE/QUEUE_ITEM',
  programId: string,
  item: ActionQueueItem
}

type UpdateProgramStateAction = {
  type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE',
  state: ActionProgramState
}

export type ActionQueueAction = LoadActionQueueStateAction | ScheduleProgramAction | UpdateProgramStateAction

export const scheduleActionProgram = (program: ActionProgram) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)
  const programId = program.programId

  // Persist the ActionProgram to the ActionQueueStore
  const programState = await store.createActionQueueItem(program)

  dispatch({
    type: 'ACTION_QUEUE/QUEUE_ITEM',
    programId,
    item: {
      program: program,
      state: programState
    }
  })
}

export const updateActionProgramState = (programState: ActionProgramState) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)

  await store.updateActionQueueItem(programState)

  dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: programState })
}
