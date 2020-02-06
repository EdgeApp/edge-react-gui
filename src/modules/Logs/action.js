// @flow

import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import packageJson from '../../../package.json'
import s from '../../locales/strings.js'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import * as LOGGER from '../../util/logger'
import * as LOGS_API from './api'

export const sendLogs = (text: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'LOGS/SEND_LOGS_REQUEST', text })

  const core = getState().core
  let walletDump = ''
  if (core && core.wallets && core.wallets.byId) {
    let accountSummary = '***Account Wallet Summary***\n'
    for (const walletId in core.wallets.byId) {
      const codes = await core.wallets.byId[walletId].getEnabledTokens()
      if (codes.length === 0) {
        codes.push(core.wallets.byId[walletId].currencyInfo.currencyCode)
      }
      for (let i = 0; i < codes.length; i++) {
        const txs = await core.wallets.byId[walletId].getNumTransactions({ currencyCode: codes[i] })
        accountSummary += `${codes[i]}: ${txs} txs\n`
      }
    }
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
    walletDump = accountSummary + walletDump
  }
  const appInfo = `App version: ${packageJson.version}
App build: ${DeviceInfo.getReadableVersion()}
os: ${Platform.OS} ${Platform.Version}
device: ${DeviceInfo.getBrand()} ${DeviceInfo.getDeviceId()}
`

  return LOGGER.log('SENDING LOGS WITH MESSAGE: ' + text)
    .then(() => LOGGER.log(appInfo))
    .then(() => LOGGER.log(walletDump))
    .then(() => LOGGER.readLogs())
    .then(logs => LOGS_API.sendLogs(logs))
    .then(result => dispatch({ type: 'LOGS/SEND_LOGS_SUCCESS', result }))
    .catch(error => {
      dispatch({ type: 'LOGS/SEND_LOGS_FAILURE', error })
      throw new Error(s.strings.settings_modal_send_logs_failure)
    })
}

export const resetSendLogsStatus = () => (dispatch: Dispatch) => {
  setTimeout(function () {
    dispatch({ type: 'LOGS/SEND_LOGS_PENDING' })
  }, 100)
}
