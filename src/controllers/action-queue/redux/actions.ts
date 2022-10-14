import { Dispatch, GetState } from '../../../types/reduxTypes'
import { logActivity } from '../../../util/logger'
import { ActionQueueStore, makeActionQueueStore } from '../ActionQueueStore'
import { uploadPushEvents } from '../push'
import { getEffectPushEventIds } from '../runtime'
import { ActionProgram, ActionProgramState, ActionQueueItem, ActionQueueMap } from '../types'

type LoadActionQueueStateAction = {
  type: 'ACTION_QUEUE/LOAD_QUEUE'
  data: ActionQueueMap
}

type ScheduleProgramAction = {
  type: 'ACTION_QUEUE/QUEUE_ITEM'
  programId: string
  item: ActionQueueItem
}

type UpdateProgramStateAction = {
  type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE'
  state: ActionProgramState
}

export type ActionQueueAction = LoadActionQueueStateAction | ScheduleProgramAction | UpdateProgramStateAction

export const scheduleActionProgram = (program: ActionProgram) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const clientId = state.core.context.clientId
  const store: ActionQueueStore = makeActionQueueStore(state.core.account, clientId)
  const programId = program.programId

  // Persist the ActionProgram to the ActionQueueStore
  const programState = await store.createActionQueueItem(program)

  logActivity(`Scheduled Action Program`, { programId })

  dispatch({
    type: 'ACTION_QUEUE/QUEUE_ITEM',
    programId,
    item: {
      program,
      state: programState
    }
  })
}

export const updateActionProgramState = (programState: ActionProgramState) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const clientId = state.core.context.clientId
  const store: ActionQueueStore = makeActionQueueStore(state.core.account, clientId)

  await store.updateActionQueueItem(programState)

  dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: programState })
}

export const cancelActionProgram = (programId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  const clientId = state.core.context.clientId
  const store: ActionQueueStore = makeActionQueueStore(state.core.account, clientId)
  const { state: programState } = state.actionQueue.actionQueueMap[programId]

  const pushEventIds = getEffectPushEventIds(programState.effect)
  if (pushEventIds.length > 0) {
    await uploadPushEvents({ account, clientId }, { removeEvents: pushEventIds })
  }

  programState.effect = { type: 'done', cancelled: true }

  await store.updateActionQueueItem(programState)

  logActivity(`Cancelled Action Program`, { programId })

  dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: programState })
}
