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

export const scheduleActionProgram = (actionProgram: ActionProgram) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)
  const programId = actionProgram.programId
  console.log(`\x1b[30m\x1b[42m === ${'scheduleActionProgram: ' + actionProgram.programId} === \x1b[0m`)

  // Save ActionProgram
  const actionProgramItemId = `${programId}:ActionProgram`
  await store.set(actionProgramItemId, actionProgram)

  // Create and save ActionProgramState
  const actionProgramState: ActionProgramState = {
    programId: programId
  }
  const actionProgramStateItemId = `${programId}:ActionProgramState`
  await store.set(actionProgramStateItemId, actionProgramState)

  dispatch({
    type: 'ACTION_QUEUE/QUEUE_ITEM',
    programId,
    item: {
      program: actionProgram,
      state: actionProgramState
    }
  })
}

export const updateActionProgramState = (actionProgramState: ActionProgramState) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)

  const actionProgramStateItemId = `${actionProgramState.programId}:ActionProgramState`
  await store.set(actionProgramStateItemId, actionProgramState)

  dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: actionProgramState })
}
