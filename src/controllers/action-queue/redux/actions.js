// @flow

import { type Dispatch, type GetState } from '../../../types/reduxTypes'
import { type ActionQueueStore, makeActionQueueStore } from '../ActionQueueStore'
import { type ActionProgram, type ActionProgramState, type ActionQueueItem, type ActionQueueMap } from '../types'

type LoadActionQueueStateAction = {
  type: 'ACTION_QUEUE/LOAD_QUEUE',
  data: ActionQueueMap
}

export const loadActionQueueState = (data: ActionQueueMap): LoadActionQueueStateAction => {
  return {
    type: 'ACTION_QUEUE/LOAD_QUEUE',
    data
  }
}

type ScheduleProgramAction = {
  type: 'ACTION_QUEUE/QUEUE_ITEM',
  programId: string,
  item: ActionQueueItem
}

export const scheduleActionProgram = (actionProgram: ActionProgram) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)
  const programId = actionProgram.programId

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

type UpdateProgramStateAction = {
  type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE',
  state: ActionProgramState
}

export const updateActionProgramState = (actionProgramState: ActionProgramState) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const store: ActionQueueStore = makeActionQueueStore(state.core.account)

  const actionProgramStateItemId = `${actionProgramState.programId}:ActionProgramState`
  await store.set(actionProgramStateItemId, actionProgramState)

  dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: actionProgramState })
}

export type ActionQueueAction = LoadActionQueueStateAction | ScheduleProgramAction | UpdateProgramStateAction
