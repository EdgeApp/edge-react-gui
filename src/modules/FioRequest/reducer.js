// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { ExchangedFlipInputAmounts } from '../UI/components/FlipInput/ExchangedFlipInput2.js'

export type FioRequestState = {
  requests: Object[],
  amounts: ExchangedFlipInputAmounts,
  fioModalData: any,
  sentRequests: Object[],
  fioPendingRequestSelected: Object,
  fioSentRequestSelected: Object
}

const initialState: FioRequestState = {
  requests: [],
  amounts: {
    exchangeAmount: '',
    nativeAmount: ''
  },
  fioModalData: {},
  sentRequests: [],
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
      const fioRequestsPending = [...state.requests, ...action.data.fioRequestsPending]
      return {
        ...state,
        requests: fioRequestsPending
      }
    case 'FIO/FIO_REQUEST_LIST_SENT':
      if (!action.data) throw new Error('Invalid action FIO_REQUEST_LIST_SENT')
      const fioRequestsSent = [...state.sentRequests, ...action.data.fioRequestsSent]
      return {
        ...state,
        sentRequests: fioRequestsSent
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
