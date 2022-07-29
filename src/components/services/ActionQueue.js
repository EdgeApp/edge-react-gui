// @flow

import { type EdgeAccount } from 'edge-core-js'

import { ACTION_QUEUE_DATASTORE_ID, makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { loadActionQueueState, updateActionProgramState } from '../../controllers/action-queue/redux/actions'
import { executeActionProgram } from '../../controllers/action-queue/runtime'
import { type ActionQueueMap } from '../../controllers/action-queue/types'
import { addPushEvents } from '../../controllers/push/redux/actions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useRef, useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const ActionQueue = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const queue: ActionQueueMap = useSelector(state => state.actionQueue.queue)

  const executingRef = useRef<{ [programId: string]: boolean }>({})

  console.log(`=== init queue ===`)
  console.log(`\x1b[34m\x1b[43m === ${JSON.stringify(queue, null, 2)} === \x1b[0m`)
  //
  // Initialization
  //
  const [isInitDone, setisInitDone] = useState(true)

  // useAsyncEffect(async () => {
  //   console.log(`=== ActionQueue Init ===`)
  //   if (account?.dataStore != null) {
  //     console.log(`=== ActionQueue Init - making store ===`)
  //     const store = makeActionQueueStore(account)
  //     console.log(`\x1b[30m\x1b[42m === ${JSON.stringify(await store.list(), null, 2)} === \x1b[0m`)
  //     const queue = await store.getActionQueueMap()
  //     // dispatch(loadActionQueueState(queue))

  //     // delete
  //     const itemIds = Object.keys(queue)
  //     for (let i = 0; i < itemIds.length; i++) {
  //       await account.dataStore.deleteItem(ACTION_QUEUE_DATASTORE_ID, itemIds[i])
  //       console.log(`\n${'V'.repeat(20)}[ deleted ]${'V'.repeat(20)}\n${JSON.stringify(itemIds[i], null, 2)}\n${'^'.repeat(80)}`)
  //     }

  //     setisInitDone(true)

  //     const newQueue = await store.getActionQueueMap()
  //     console.log(`\x1b[30m\x1b[42m === ${'isInitDone'} === \x1b[0m`)
  //     console.log(`\x1b[30m\x1b[42m === ${'newQueue' + JSON.stringify(newQueue, null, 2)} === \x1b[0m`)
  //   }
  // }, [account, dispatch])

  //
  // Runtime
  //

  useAsyncEffect(async () => {
    if (queue != null && isInitDone) {
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
          console.log(`\x1b[30m\x1b[42m === ${'Runtime queue'} === \x1b[0m`)
          console.log(`\x1b[30m\x1b[42m === ${JSON.stringify(queue, null, 2)} === \x1b[0m`)

          console.log(`\x1b[30m\x1b[42m === ${'Executing program: ' + programId} === \x1b[0m`)

          const { program, state } = queue[programId]
          const { nextState, pushEvents } = await executeActionProgram(account, program, state).catch((error: Error) => ({
            nextState: {
              ...state,
              effect: { type: 'done', error }
            },
            pushEvents: []
          }))

          // Add push events
          dispatch(addPushEvents(pushEvents))

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
