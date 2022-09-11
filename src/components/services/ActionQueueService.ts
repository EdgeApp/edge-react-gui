import { EdgeAccount } from 'edge-core-js'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { mockActionProgram } from '../../controllers/action-queue/mock'
import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime'
import { ActionQueueMap, ExecutionContext } from '../../controllers/action-queue/types'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useRef } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const ActionQueueService = () => {
  const dispatch = useDispatch()
  // @ts-expect-error
  const account: EdgeAccount = useSelector(state => state.core.account)
  // @ts-expect-error
  const clientId: string = useSelector(state => state.core.context.clientId)
  // @ts-expect-error
  const queue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  const executingRef = useRef<{ [programId: string]: boolean }>({})

  const executionContext: ExecutionContext = { account, clientId }

  //
  // Initialization
  //

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (account?.dataStore != null) {
      const store = makeActionQueueStore(account, clientId)
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

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (queue != null) {
      const executing = executingRef.current
      const promises = Object.keys(queue)
        .filter(programId => !executing[programId] && queue[programId].state.clientId === clientId)
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

          const { nextState } = await executeActionProgram(executionContext, program, state).catch((error: Error) => {
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
          // @ts-expect-error
          dispatch(updateActionProgramState(nextState))

          // Unset program to running
          executing[programId] = false
        })

      await Promise.all(promises)
    }
  }, [queue])

  return null
}
