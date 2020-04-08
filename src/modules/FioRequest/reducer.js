// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { ExchangedFlipInputAmounts } from '../UI/components/FlipInput/ExchangedFlipInput2.js'

export type FioRequestState = {
  amounts: ExchangedFlipInputAmounts,
  fioModalData: any,
  requests: Object[],
  sentRequests: Object[],
  requestsLoading: boolean,
  sentRequestsLoading: boolean,
  fioPendingRequestSelected: Object,
  fioSentRequestSelected: Object
}

const initialState: FioRequestState = {
  amounts: {
    exchangeAmount: '',
    nativeAmount: ''
  },
  fioModalData: {},
  requests: [],
  sentRequests: [],
  requestsLoading: false,
  sentRequestsLoading: false,
  fioPendingRequestSelected: {},
  fioSentRequestSelected: {}
}

export const fioRequest: Reducer<FioRequestState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/FIO_REQUEST_CHANGE_AMOUNTS':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_CHANGE_AMOUNTS')
      return {
        ...state,
        amounts: action.data.amounts
      }
    case 'FIO/FIO_REQUEST_SAVE_MODAL_DATA':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_CHANGE_AMOUNTS')
      return {
        ...state,
        fioModalData: action.data.fioModalData
      }
    case 'FIO/FIO_REQUEST_LIST_PENDING':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_PENDING')
      if (!action.data.isLoading) {
        return {
          ...state,
          requestsLoading: false
        }
      }
      if (action.data.isReset) {
        return {
          ...state,
          requests: [],
          requestsLoading: action.data.isLoading
        }
      }
      const fioRequestsPending = [...state.requests, ...action.data.fioRequestsPending]
      return {
        ...state,
        requests: fioRequestsPending,
        requestsLoading: action.data.isLoading
      }
    case 'FIO/FIO_REQUEST_LIST_SENT':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_SENT')
      if (!action.data.isLoading) {
        return {
          ...state,
          sentRequestsLoading: false
        }
      }
      if (action.data.isReset) {
        return {
          ...state,
          sentRequests: [],
          sentRequestsLoading: action.data.isLoading
        }
      }
      const fioRequestsSent = [...state.sentRequests, ...action.data.fioRequestsSent]
      return {
        ...state,
        sentRequests: fioRequestsSent,
        sentRequestsLoading: action.data.isLoading
      }
    case 'FIO/FIO_PENDING_REQUEST_SELECTED':
      if (!action.data) throw new Error('Invalid action FIO_PENDING_REQUEST_SELECTED')
      return {
        ...state,
        fioPendingRequestSelected: action.data.fioPendingRequestSelected
      }
    case 'FIO/FIO_SENT_REQUEST_SELECTED':
      if (!action.data) throw new Error('Invalid action FIO_SENT_REQUEST_SELECTED')

      return {
        ...state,
        fioSentRequestSelected: action.data.fioSentRequestSelected
      }
    case 'FIO/FIO_REQUEST_LIST_REMOVE':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_REMOVE')
      if (!action.data.requestId) return state
      const { requestId } = action.data
      return {
        ...state,
        requests: state.requests.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId))
      }
    default:
      return state
  }
}
