// @flow

import { type EdgeAccount } from 'edge-core-js'
import { getUniqueId } from 'react-native-device-info'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { mockActionProgram } from '../../controllers/action-queue/mock'
import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime'
import { type ActionQueueMap } from '../../controllers/action-queue/types'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useRef } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const ActionQueueService = () => {
  const deviceId = getUniqueId()
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const queue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  const executingRef = useRef<{ [programId: string]: boolean }>({})

  //
  // Initialization
  //

  useAsyncEffect(async () => {
    if (account?.dataStore != null) {
      const store = makeActionQueueStore(account, deviceId)
      const queue = await store.getActionQueueMap()
      dispatch({
        type: 'ACTION_QUEUE/LOAD_QUEUE',
        data: queue
      })
    }
  }, [account, dispatch])

  //
  // Runtime
  //

  useAsyncEffect(async () => {
    if (queue != null) {
      const executing = executingRef.current
      const promises = Object.keys(queue)
        .filter(
          programId =>
            // Ignore running programs and programs not assigned to this device
            !executing[programId] && queue[programId].state.deviceId === deviceId
        )
        .map(async programId => {
          // Set program to running
          executing[programId] = true

          const { program, state } = queue[programId]

          if (program.mockMode) {
            const { nextState } = await mockActionProgram(account, program, state)
            dispatch(updateActionProgramState(nextState))
            executing[programId] = false
            return
          }

          const { nextState } = await executeActionProgram(account, program, state).catch((error: Error) => {
            console.warn(new Error('Action Program Exception: ' + error.message))
            console.error(error)
            return {
              nextState: {
                ...state,
                effect: { type: 'done', error }
              }
            }
          })

          // Update program state
          dispatch(updateActionProgramState(nextState))

          // Unset program to running
          executing[programId] = false
        })

      await Promise.all(promises)
    }
  }, [queue])

  return null
}
