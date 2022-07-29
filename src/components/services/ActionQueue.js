// @flow

import { type EdgeAccount } from 'edge-core-js'

import { makeActionQueueStore } from '../../controllers/action-queue/ActionQueueStore'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const ActionQueue = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)

  //
  // Initialization
  //

  useAsyncEffect(async () => {
    if (account?.dataStore != null) {
      const store = makeActionQueueStore(account)
      const queue = await store.getActionQueueMap()
      dispatch({
        type: 'ACTION_QUEUE/LOAD_QUEUE',
        data: queue
      })
    }
  }, [account, dispatch])

  return null
}
