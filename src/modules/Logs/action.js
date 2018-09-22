// @flow

import * as LOGGER from '../../util/logger'
import type { Dispatch, GetState } from '../ReduxTypes.js'
import * as LOGS_API from './api'

export const sendLogs = (text: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'LOGS/SEND_LOGS_REQUEST', text })

  const core = getState().core
  let walletDump = ''
  if (core && core.wallets && core.wallets.byId) {
    for (const walletId in core.wallets.byId) {
      const wallet = core.wallets.byId[walletId]
      if (wallet) {
        const dataDump = await wallet.dumpData()
        let ds = ''
        ds = ds + '--------------------- Wallet Data Dump ----------------------\n'
        ds = ds + `Wallet ID: ${dataDump.walletId}\n`
        ds = ds + `Wallet Type: ${dataDump.walletType}\n`
        ds = ds + `Plugin Type: ${dataDump.pluginType}\n`
        ds = ds + '------------------------- Data -------------------------\n'
        for (const cache in dataDump.data) {
          try {
            let t = `-------------------- ${cache} ---------------------\n`
            // $FlowFixMe
            t = t + `${JSON.stringify(dataDump.data[cache], null, 2)}\n`
            ds = ds + t
          } catch (e) {
            console.error(e)
          }
        }
        ds = ds + '------------------ End of Wallet Data Dump ------------------\n\n'
        walletDump = walletDump + ds
      }
    }
  }

  LOGGER.log('SENDING LOGS WITH MESSAGE: ' + text)
    // $FlowFixMe
    .then(LOGGER.log(walletDump))
    .then(LOGGER.readLogs)
    .then(LOGS_API.sendLogs)
    .then(result => dispatch({ type: 'LOGS/SEND_LOGS_SUCCESS', result }))
    .catch(error => dispatch({ type: 'LOGS/SEND_LOGS_FAILURE', error }))
}

export const resetSendLogsStatus = () => (dispatch: Dispatch) => {
  setTimeout(function () {
    dispatch({
      type: 'LOGS/SEND_LOGS_PENDING'
    })
  }, 100)
}
