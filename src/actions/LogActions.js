// @flow

import { type EdgeDataDump } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import { getBrand, getBuildNumber, getDeviceId, getVersion } from 'react-native-device-info'
import { base16, base64 } from 'rfc4648'

import packageJson from '../../package.json'
import { TextInputModal } from '../components/modals/TextInputModal.js'
import { Airship, showError, showToast } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import { sendLogs } from '../modules/Logs/api.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { log, readLogs } from '../util/logger.js'

export const showSendLogsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { isConnected } = state.network
  if (!isConnected) return showError(s.strings.network_alert_title)

  Airship.show(bridge => (
    <TextInputModal
      bridge={bridge}
      inputLabel={s.strings.settings_modal_send_logs_label}
      returnKeyType="send"
      title={s.strings.settings_button_send_logs}
      onSubmit={async notes => {
        await dispatch(prepareLogs(notes))
        showToast(s.strings.settings_modal_send_logs_success)
        return true
      }}
    />
  ))
}

const prepareLogs = (text: string) => async (dispatch: Dispatch, getState: GetState) => {
  const logOutput: LogOutput = {
    isoDate: new Date().toISOString(),
    uniqueId: Math.floor(Math.random() * 16777215).toString(16),
    userMessage: text,
    deviceInfo: `${getBrand()} ${getDeviceId()}`,
    appVersion: packageJson.version,
    OS: Platform.OS,
    accounts: [],
    data: ''
  }
  const state = getState()
  const { account, context } = state.core
  if (context) {
    // Get local accounts
    for (const user of context.localUsers) {
      logOutput.accounts.push({ username: user.username, userId: '' })
    }
  }

  if (account.loggedIn === true) {
    const { currencyWallets, rootLoginId, keys, username } = account
    logOutput.loggedInUser = {
      userId: rootLoginId,
      userName: username,
      wallets: []
    }
    logOutput.acctRepoId = getRepoId(keys.syncKey)
    logOutput.data += '***Account Wallet Summary***\n'
    for (const walletId of Object.keys(currencyWallets)) {
      // Wallet TX summary
      const codes = await currencyWallets[walletId].getEnabledTokens()
      if (codes.length === 0) {
        codes.push(currencyWallets[walletId].currencyInfo.currencyCode)
      }
      for (let i = 0; i < codes.length; i++) {
        const txs = await currencyWallets[walletId].getNumTransactions({ currencyCode: codes[i] })
        logOutput.data += `${codes[i]}: ${txs} txs\n`
      }

      // Wallet info
      const wallet = currencyWallets[walletId]
      if (wallet && logOutput.loggedInUser) {
        const currencyCode = wallet.currencyInfo.currencyCode ?? ''
        logOutput.loggedInUser.wallets.push({
          currencyCode,
          repoId: getRepoId(wallet.keys.syncKey),
          imported: wallet.keys.imported,
          pluginDump: await wallet.dumpData()
        })
      }
    }
  }
  logOutput.data += `App version: ${packageJson.version}
App build: ${getVersion()}.${getBuildNumber()}
os: ${Platform.OS} ${Platform.Version}
device: ${getBrand()} ${getDeviceId()}
`

  return log('SENDING LOGS WITH MESSAGE: ' + text)
    .then(() => readLogs())
    .then(logs => {
      logOutput.data += logs || ''
      return sendLogs(logOutput)
    })
    .catch(e => {
      throw new Error(`${s.strings.settings_modal_send_logs_failure} code ${e.message}`)
    })
}

function getRepoId(key: string): string {
  if (typeof key === 'string') {
    return base16.stringify(base64.parse(key)).toLowerCase()
  }
  return 'Invalid syncKey type'
}

type Accounts = {
  username: string
}

type Wallets = {
  currencyCode?: string,
  repoId?: string,
  pluginDump?: EdgeDataDump
}

type LoggedInUser = {
  userName: string,
  userId: string,
  wallets: Wallets[]
}

type LogOutput = {
  isoDate: string,
  uniqueId: string,
  userMessage: string,
  deviceInfo: string,
  appVersion: string,
  OS: string,
  acctRepoId?: string,
  accounts: Accounts[],
  loggedInUser?: LoggedInUser,
  data: string
}
