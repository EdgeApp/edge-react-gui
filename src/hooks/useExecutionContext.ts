import { EdgeAccount } from 'edge-core-js'

import { ExecutionContext } from '../controllers/action-queue/types'
import { makeExecutionContext } from '../controllers/action-queue/util/makeExecutionContext'
import { useSelector, useStore } from '../types/reactRedux'

export const useExecutionContext = (mockMode?: boolean): ExecutionContext => {
  const store = useStore()
  const { dispatch, getState } = store

  const account: EdgeAccount = useSelector(state => state.core.account)
  const clientId: string = useSelector(state => state.core.context.clientId)

  return makeExecutionContext({ account, clientId, dispatch, getState }, mockMode)
}
