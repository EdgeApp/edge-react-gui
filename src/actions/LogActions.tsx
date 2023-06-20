import { uncleaner } from 'cleaners'
import { EdgeDataDump } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import { getBrand, getBuildNumber, getDeviceId, getVersion } from 'react-native-device-info'
import { base16, base64 } from 'rfc4648'

import packageJson from '../../package.json'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { LogsModal } from '../components/modals/LogsModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { asActionProgram, asActionProgramState } from '../controllers/action-queue/cleaners'
import { ActionProgram, ActionProgramState } from '../controllers/action-queue/types'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { clearLogs, logWithType, readLogs } from '../util/logger'

const logsUri = 'https://logs1.edge.app/v1/log/'

export interface MultiLogOutput {
  activity: LogOutput
  info: LogOutput
}

export interface LogOutput {
  isoDate: string
  uniqueId: string
  userMessage: string
  deviceInfo: string
  appVersion: string
  OS: string
  acctRepoId?: string
  accounts: Accounts[]
  loggedInUser?: LoggedInUser
  data: string
}

interface Accounts {
  username: string
  userId: string // Not sure what this is used for, but adding the type anyway
}

interface LoggedInUser {
  userName: string
  userId: string
  wallets: WalletData[]
  actions: ActionData[]
}

interface WalletData {
  currencyCode?: string
  imported?: boolean
  repoId?: string
  pluginDump?: EdgeDataDump
}

// Modeled from ActionQueueItem type but separate in order to avoid
// be explicit about what information is shared.
interface ActionData {
  program: ActionProgram
  state: ActionProgramState
}

export function showSendLogsModal(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { isConnected } = state.network
    if (!isConnected) return showError(lstrings.network_alert_title)
    const logs = await dispatch(getLogOutput())
    await Airship.show(bridge => <LogsModal bridge={bridge} logs={logs} />)
  }
}

export function showClearLogsModal(): ThunkAction<Promise<void>> {
  return async (dispatch, _getState) => {
    Airship.show<string | number | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.settings_button_clear_logs}
        message={lstrings.settings_modal_clear_logs_message}
        buttons={{
          yes: {
            label: 'Clear',
            type: 'secondary',
            onPress: async () => {
              await clearAllLogs()
              showToast(lstrings.settings_modal_clear_logs_success)
              return true
            }
          },
          no: {
            label: 'Cancel',
            type: 'escape'
          }
        }}
      />
    )).catch(showError)
  }
}

export async function clearAllLogs(): Promise<void> {
  await clearLogs('activity')
  await logWithType('activity', 'CLEARED ACTIVITY LOGS')
  await clearLogs('info')
  await logWithType('info', 'CLEARED INFO LOGS')
}

export function getLogOutput(): ThunkAction<Promise<MultiLogOutput>> {
  return async (dispatch, getState) => {
    const id = Math.floor(Math.random() * 0xffffff).toString(16)
    const infoId = id + '_info'
    const activityId = id + '_activity'

    const logOutput: LogOutput = {
      isoDate: new Date().toISOString(),
      uniqueId: infoId,
      userMessage: '',
      deviceInfo: `${getBrand()} ${getDeviceId()}`,
      appVersion: packageJson.version,
      OS: Platform.OS,
      accounts: [],
      data: ''
    }

    const activityOutput: LogOutput = { ...logOutput }
    activityOutput.uniqueId = activityId

    const state = getState()
    const { actionQueue, core } = state
    const { account, context } = core

    if (context) {
      // Get local accounts
      for (const user of context.localUsers) {
        logOutput.accounts.push({
          username: user.username ?? '<undefined>',
          userId: ''
        })
      }
    }

    if (account.loggedIn) {
      const { currencyWallets, rootLoginId, username } = account
      const { actionQueueMap } = actionQueue

      const { syncKey } = await account.getRawPrivateKey(account.id)

      logOutput.loggedInUser = {
        userId: rootLoginId,
        userName: username ?? '<undefined>',
        wallets: [],
        actions: []
      }
      logOutput.acctRepoId = getRepoId(syncKey)
      logOutput.data += '***Account Wallet Summary***\n'

      //
      // Wallet Data
      //

      for (const walletId of Object.keys(currencyWallets)) {
        // Wallet TX summary
        const wallet = currencyWallets[walletId]
        const { enabledTokenIds } = wallet
        const codes = enabledTokenIds.map(id => wallet.currencyConfig.allTokens[id].currencyCode)
        if (codes.length === 0) {
          codes.push(wallet.currencyInfo.currencyCode)
        }
        for (const code of codes) {
          const txs = await wallet.getNumTransactions({ currencyCode: code })
          logOutput.data += `${code}: ${txs} txs\n`
        }
        const { imported, syncKey } = await account.getRawPrivateKey(wallet.id)

        // Wallet info
        if (wallet && logOutput.loggedInUser) {
          const currencyCode = wallet.currencyInfo.currencyCode ?? ''
          logOutput.loggedInUser.wallets.push({
            currencyCode,
            imported,
            repoId: getRepoId(syncKey),
            pluginDump: await wallet.dumpData()
          })
        }
      }

      //
      // Action Data
      //

      for (const actionQueueItem of Object.values(actionQueueMap)) {
        const actionData = {
          program: uncleaner(asActionProgram)(actionQueueItem.program),
          state: uncleaner(asActionProgramState)(actionQueueItem.state)
        }
        logOutput.loggedInUser.actions.push(actionData)
      }
    }

    logOutput.data += `App version: ${packageJson.version}
App build: ${getVersion()}.${getBuildNumber()}
os: ${Platform.OS} ${Platform.Version}
device: ${getBrand()} ${getDeviceId()}
`

    // Get activity logs
    const activityLogs = await readLogs('activity')
    activityOutput.data += activityLogs == null ? '' : activityLogs

    // Get info logs
    const infoLogs = await readLogs('info')
    logOutput.data += infoLogs == null ? '' : infoLogs

    return { activity: activityOutput, info: logOutput }
  }
}

function getRepoId(key: string): string {
  if (typeof key === 'string') {
    return base16.stringify(base64.parse(key)).toLowerCase()
  }

  return 'Invalid syncKey type'
}

export const sendLogs = async (logs: LogOutput) => {
  console.log('====== SENDING LOGS REQUEST ======')

  return await fetch(logsUri, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logs)
  })
    .then(response => {
      if (!response.ok) {
        throw Error(`${logsUri} returned status ${response.status}`)
      }
      console.log(`====== SENDING LOGS SUCCESS ======`, response)
      return response
    })
    .catch(error => {
      console.log(`====== SENDING LOGS FAILURE ======`, error)
      throw error
    })
}
