// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { FioRequest } from '../../types/types'

export type FioRequestState = {
  fioRequestsPending: FioRequest[],
  fioRequestsSent: FioRequest[],
  pendingRequestsLoading: boolean,
  sentRequestsLoading: boolean
}

const initialState: FioRequestState = {
  fioRequestsPending: [],
  fioRequestsSent: [],
  pendingRequestsLoading: false,
  sentRequestsLoading: false
}

export const fioRequest: Reducer<FioRequestState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/FIO_REQUEST_LIST_PENDING':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_PENDING')
      if (action.data.isReset) {
        return {
          ...state,
          fioRequestsPending: [],
          pendingRequestsLoading: action.data.isLoading
        }
      }
      if (!action.data.isLoading) {
        return {
          ...state,
          pendingRequestsLoading: false
        }
      }
      const fioRequestsPending = [...state.fioRequestsPending, ...action.data.fioRequestsPending]
      return {
        ...state,
        fioRequestsPending,
        pendingRequestsLoading: action.data.isLoading
      }
    case 'FIO/FIO_REQUEST_LIST_SENT':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_SENT')
      if (action.data.isReset) {
        return {
          ...state,
          fioRequestsSent: [],
          sentRequestsLoading: action.data.isLoading
        }
      }
      if (!action.data.isLoading) {
        return {
          ...state,
          sentRequestsLoading: false
        }
      }
      const fioRequestsSent = [...state.fioRequestsSent, ...action.data.fioRequestsSent]
      return {
        ...state,
        fioRequestsSent,
        sentRequestsLoading: action.data.isLoading
      }
    case 'FIO/FIO_REQUEST_LIST_REMOVE':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_REMOVE')
      if (!action.data.requestId) return state
      const { requestId } = action.data
      return {
        ...state,
        fioRequestsPending: state.fioRequestsPending.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId))
      }
    default:
      return state
  }
}
