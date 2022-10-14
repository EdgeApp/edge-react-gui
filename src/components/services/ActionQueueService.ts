import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { useRef } from 'react'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { mockActionProgram } from '../../controllers/action-queue/mock'
import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime/executeActionProgram'
import { ActionProgramState, ActionQueueMap, ExecutionContext, ExecutionResults } from '../../controllers/action-queue/types'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { makePeriodicTask } from '../../util/PeriodicTask'

const EXECUTION_INTERVAL = 1000

type ServiceProgramStates = {
  [programId: string]: {
    executing: boolean
  }
}

export const ActionQueueService = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const clientId: string = useSelector(state => state.core.context.clientId)
  const actionQueueMap: ActionQueueMap = useSelector(state => state.actionQueue.actionQueueMap)
  const activeProgramIds = useSelector(state => state.actionQueue.activeProgramIds)
  const serviceProgramStatesRef = useRef<ServiceProgramStates>({})

  const executionContext: ExecutionContext = React.useMemo(
    () => ({
      account,
      clientId
    }),
    [account, clientId]
  )

  const updateProgramState = useHandler(async (state: ActionProgramState, executing: boolean) => {
    const { programId } = state
    // Update service level state
    const serviceProgramStates = serviceProgramStatesRef.current
    serviceProgramStates[programId] = { ...serviceProgramStates[programId], executing }
    // Update action queue level state
    await dispatch(
      updateActionProgramState({
        ...state,
        executing: executing
      })
    )
  })

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
    const serviceProgramStates = serviceProgramStatesRef.current

    const { clientId } = executionContext

    // Loop function
    const task = async () => {
      // Programs that require immediate attention
      const urgentProgramIds = activeProgramIds.filter(programId => {
        const { state } = actionQueueMap[programId]
        // Don't execute programs which are assigned to another client.
        // This predicate must come first to avoid the device/client from
        // impacting program heing handled by other clients.
        if (state.clientId !== clientId) return false
        // Don't execute programs which are currently being executed by service
        if (state.executing && serviceProgramStates[programId]) {
          return false
        }
        // Detect program interruption if service is not evaluating the program
        // and program evaluation was executing an action op.
        if (state.executing && !serviceProgramStates[programId] && state.effective) {
          dispatch(
            updateActionProgramState({
              ...state,
              effect: { type: 'done', error: new Error('Program Interrupted') },
              executing: false
            })
          )
          return false
        }
        // Don't execute programs which have not reached their scheduled time
        if (!state.effective && state.nextExecutionTime > Date.now()) return false
        // Otherwise, it's safe to execute
        return true
      })
      // Act on urgent programs
      const promises = urgentProgramIds.map(async programId => {
        const { program, state } = actionQueueMap[programId]

        // Set program state to executing
        await updateProgramState(state, true)

        // Use mock execution function if program is marked as mockMode
        const executeActionProgramFn = program.mockMode ? mockActionProgram : executeActionProgram

        const { nextState } = await executeActionProgramFn(executionContext, program, state).catch((error: Error): ExecutionResults => {
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
        await updateProgramState(nextState, false)
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
  }, [dispatch, executionContext, updateProgramState, actionQueueMap, activeProgramIds])

  // Return no component/view
  return null
}
