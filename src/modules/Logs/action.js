import * as LOGS_API from './api'
import * as LOGGER from '../../util/logger'

const PREFIX = 'Logs/'

export const SEND_LOGS_REQUEST = PREFIX + 'SEND_LOGS_REQUEST'
export const SEND_LOGS_SUCCESS = PREFIX + 'SEND_LOGS_SUCCESS'
export const SEND_LOGS_FAILURE = PREFIX + 'SEND_LOGS_FAILURE'

export const sendLogs = (text) => (dispatch) => {
  dispatch({type: SEND_LOGS_REQUEST, text})

  LOGGER.log('SENDING LOGS WITH MESSAGE: ' + text)
    .then(LOGGER.readLogs)
    .then(LOGS_API.sendLogs)
    .then((result) => dispatch({type: SEND_LOGS_SUCCESS, result}))
    .catch((error) => dispatch({type: SEND_LOGS_FAILURE, error}))
}
