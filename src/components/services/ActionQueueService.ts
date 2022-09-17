import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { mockActionProgram } from '../../controllers/action-queue/mock'
import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime'
import { ActionQueueMap, ExecutionContext } from '../../controllers/action-queue/types'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useMemo } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { makePeriodicTask } from '../../util/PeriodicTask'

const EXECUTION_INTERVAL = 1000

export const ActionQueueService = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const clientId: string = useSelector(state => state.core.context.clientId)
  const queue: ActionQueueMap = useSelector(state => state.actionQueue.queue)

  const executionContext: ExecutionContext = useMemo(
    () => ({
      account,
      clientId
    }),
    [account, clientId]
  )

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
  // Runtime Loop
  //

  React.useEffect(() => {
    if (queue == null) return

    const { account, clientId } = executionContext

    // Loop function
    const task = async () => {
      // Programs that require immediate attention
      const urgentProgramIds = Object.keys(queue).filter(programId => {
        const { state } = queue[programId]
        // Don't execute programs which are assigned to another client
        if (state.clientId !== clientId) return false
        // Don't execute programs which are currently executing
        if (state.executing) return false
        // Don't execute programs which have not reached their scheduled time
        if (!state.effective && state.nextExecutionTime > Date.now()) return false
        return true
      })
      // Act on urgent programs
      const promises = urgentProgramIds.map(async programId => {
        const { program, state } = queue[programId]

        // Set program state to executing
        await dispatch(
          updateActionProgramState({
            ...state,
            executing: true
          })
        )

        if (program.mockMode) {
          const { nextState } = await mockActionProgram(account, program, state)
          // Update program state
          dispatch(updateActionProgramState({ ...nextState, executing: false }))
          return
        }

        const { nextState } = await executeActionProgram(executionContext, program, state).catch((error: Error) => {
          console.warn(new Error('Action Program Exception: ' + error.message))
          console.error(error)
          return {
            nextState: {
              ...state,
              effect: { type: 'done', error },
              effective: true,
              nextExecutionTime: -1
            }
          }
        })

        // Update program state
        // @ts-expect-error
        await dispatch(updateActionProgramState({ ...nextState, executing: false }))
      })
      await Promise.all(promises)
    }

    // Setup loop
    const periodicTask = makePeriodicTask(task, EXECUTION_INTERVAL, {
      onError: error => {
        const errorMessage = String(error)
        console.warn(new Error('Unexpected error in ActionQueueService: ' + errorMessage))
        console.error(error)
      }
    })

    periodicTask.start()

    // Cleanup loop
    return () => periodicTask.stop()
  }, [dispatch, executionContext, queue])

  // Return no component/view
  return null
}
