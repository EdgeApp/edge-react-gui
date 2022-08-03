// @flow

import { type EdgeAccount } from 'edge-core-js'

import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime'
import { type ActionQueueMap } from '../../controllers/action-queue/types'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useRef } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const ActionQueue = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const queue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  const executingRef = useRef<{ [programId: string]: boolean }>({})

  // TODO: Fix sync server stale ActionQueue state overwrite on startup
  //
  // Initialization
  //

  // useAsyncEffect(async () => {
  //   if (account?.dataStore != null) {
  //     const store = makeActionQueueStore(account)
  //     const queue = await store.getActionQueueMap()
  //     dispatch({
  //       type: 'ACTION_QUEUE/LOAD_QUEUE',
  //       data: queue
  //     })
  //   }
  // }, [account, dispatch])

  //
  // Runtime
  //

  useAsyncEffect(async () => {
    if (queue != null) {
      const executing = executingRef.current
      const promises = Object.keys(queue)
        .filter(
          programId =>
            // Ignore running programs
            !executing[programId]
        )
        .map(async programId => {
          // Set program to running
          executing[programId] = true

          const { program, state } = queue[programId]
          const { nextState } = await executeActionProgram(account, program, state).catch((error: Error) => ({
            nextState: {
              ...state,
              effect: { type: 'done', error }
            }
          }))

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
