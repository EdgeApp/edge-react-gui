import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { useRef } from 'react'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { asCleanError } from '../../controllers/action-queue/cleaners'
import { updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime/executeActionProgram'
import { ActionProgramState, ActionQueueMap, ExecutionResults } from '../../controllers/action-queue/types'
import { wasPushRequestBody } from '../../controllers/action-queue/types/pushApiTypes'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useExecutionContext } from '../../hooks/useExecutionContext'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { makePushClient } from '../../util/PushClient/PushClient'

const EXECUTION_INTERVAL = 1000

interface ServiceProgramStates {
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

  const executionContext = useExecutionContext()
  const executionContextMock = useExecutionContext(true)

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
  // Log Dev Info
  //
  React.useEffect(() => {
    if (__DEV__ && account != null && account.rootLoginId != null && clientId != null) {
      const pushClient = makePushClient(account, clientId)
      const requestBody = pushClient.getPushRequestBody()
      console.log('***********************')
      console.log('PUSH SERVER DEV INFO:', wasPushRequestBody(requestBody))
      console.log('***********************')
    }
  }, [account, clientId])

  //
  // Initialization
  //

  useAsyncEffect(
    async () => {
      if (account?.dataStore != null) {
        const store = makeActionQueueStore(account, clientId)
        const queue = await store.getActionQueueMap()
        dispatch({
          type: 'ACTION_QUEUE/LOAD_QUEUE',
          data: queue
        })
      }
    },
    [account, dispatch],
    'ActionQueueService'
  )

  //
  // Runtime Loop
  //

  React.useEffect(() => {
    const serviceProgramStates = serviceProgramStatesRef.current

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
            // Use console.warn to not spam user
            .catch(err => console.warn(err))
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
        const context = program.mockMode ? executionContextMock : executionContext

        const { nextState } = await executeActionProgram(context, program, state).catch((error): ExecutionResults => {
          const cleanError = asCleanError(error)
          console.warn(new Error('Action Program Exception: ' + cleanError.message))
          console.error(cleanError)
          return {
            nextState: {
              ...state,
              effect: { type: 'done', error: cleanError },
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
  }, [account, clientId, dispatch, updateProgramState, actionQueueMap, activeProgramIds, executionContextMock, executionContext])

  // Return no component/view
  return null
}
