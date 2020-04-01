// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { ExchangedFlipInputAmounts } from '../UI/components/FlipInput/ExchangedFlipInput2.js'

export type FioRequestState = {
  requests: Object[],
  pendingMore: number,
  pendingPage: number,
  amounts: ExchangedFlipInputAmounts,
  fioModalData: any,
  sentRequests: Object[],
  sentMore: number,
  sentPage: number,
  fioPendingRequestSelected: Object,
  fioSentRequestSelected: Object
}

const initialState: FioRequestState = {
  requests: [],
  pendingMore: 0,
  pendingPage: 1,
  amounts: {
    exchangeAmount: '',
    nativeAmount: ''
  },
  fioModalData: {},
  sentRequests: [],
  sentMore: 0,
  sentPage: 1,
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
      // todo: implement 'more' logic
      const fioRequestsPending = [...state.requests, ...action.data.fioRequestsPending]
      return {
        ...state,
        requests: fioRequestsPending,
        pendingMore: action.data.more,
        pendingPage: action.data.page
      }
    case 'FIO/FIO_REQUEST_LIST_SENT':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_SENT')
      const fioRequestsSent = [...state.sentRequests, ...action.data.fioRequestsSent]
      return {
        ...state,
        sentRequests: fioRequestsSent,
        sentMore: action.data.more,
        sentPage: action.data.page
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
