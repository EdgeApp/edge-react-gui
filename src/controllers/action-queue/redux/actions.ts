import { ThunkAction } from '../../../types/reduxTypes'
import { logActivity } from '../../../util/logger'
import { ActionQueueStore, makeActionQueueStore } from '../ActionQueueStore'
import { uploadPushEvents } from '../push'
import { ActionProgram, ActionProgramState, ActionQueueItem, ActionQueueMap } from '../types'
import { getEffectPushEventIds } from '../util/getEffectPushEventIds'
import { makeExecutionContext } from '../util/makeExecutionContext'

interface LoadActionQueueStateAction {
  type: 'ACTION_QUEUE/LOAD_QUEUE'
  data: ActionQueueMap
}

interface ScheduleProgramAction {
  type: 'ACTION_QUEUE/QUEUE_ITEM'
  programId: string
  item: ActionQueueItem
}

interface UpdateProgramStateAction {
  type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE'
  state: ActionProgramState
}

export type ActionQueueAction = LoadActionQueueStateAction | ScheduleProgramAction | UpdateProgramStateAction

export function scheduleActionProgram(program: ActionProgram): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
}

export function updateActionProgramState(programState: ActionProgramState): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const clientId = state.core.context.clientId
    const store: ActionQueueStore = makeActionQueueStore(state.core.account, clientId)

    await store.updateActionQueueItem(programState)

    dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: programState })
  }
}

export function cancelActionProgram(programId: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    const clientId = state.core.context.clientId
    const store: ActionQueueStore = makeActionQueueStore(state.core.account, clientId)
    const { state: programState } = state.actionQueue.actionQueueMap[programId]

    const pushEventIds = getEffectPushEventIds(programState.effect)
    if (pushEventIds.length > 0) {
      const executionContext = makeExecutionContext({ account, clientId, dispatch, getState })
      await uploadPushEvents(executionContext, { removeEvents: pushEventIds })
    }

    programState.effect = { type: 'done', cancelled: true }

    await store.updateActionQueueItem(programState)

    logActivity(`Cancelled Action Program`, { programId })

    dispatch({ type: 'ACTION_QUEUE/UPDATE_PROGRAM_STATE', state: programState })
  }
}
