import '@walletconnect/react-native-compat'

import { SessionTypes } from '@walletconnect/types'
import { buildApprovedNamespaces, getSdkError, parseUri } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { EdgeCurrencyWallet, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { FlashNotification } from '../components/navigation/FlashNotification'
import { Airship } from '../components/services/AirshipInstance'
import { getClient } from '../components/services/WalletConnectService'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { useSelector } from '../types/reactRedux'
import { WalletConnectChainId, WcConnectionInfo } from '../types/types'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { runWithTimeout, unixToLocaleDateTime } from '../util/utils'
import { useHandler } from './useHandler'
import { useWatch } from './useWatch'

interface WalletConnect {
  getActiveSessions: () => Promise<WcConnectionInfo[]>
  initSession: (uri: string) => Promise<Web3WalletTypes.SessionProposal>
  approveSession: (proposal: Web3WalletTypes.SessionProposal, walletId: string) => Promise<void>
  rejectSession: (proposal: Web3WalletTypes.SessionProposal) => Promise<void>
  disconnectSession: (topic: string) => Promise<void>
  approveRequest: (topic: string, requestId: number, result: JsonObject | string) => Promise<void>
  rejectRequest: (topic: string, requestId: number) => Promise<void>
}

/**
 * Access Wallet Connect
 */
export function useWalletConnect(): WalletConnect {
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  // Utils
  const parseConnection = (session: SessionTypes.Struct, walletId: string): WcConnectionInfo => {
    const icon = session.peer.metadata.icons[0] ?? '.svg'
    const iconUri = icon.endsWith('.svg') ? 'https://content.edge.app/walletConnectLogo.png' : icon
    const { date, time } = unixToLocaleDateTime(session.expiry)
    const expiration = `${date} at ${time}`
    const connection = {
      dAppName: session.peer.metadata.name,
      dAppUrl: session.peer.metadata.url,
      expiration,
      walletName: getWalletName(currencyWallets[walletId]),
      walletId: walletId,
      uri: session.topic,
      icon: iconUri
    }
    return connection
  }

  // API
  const getActiveSessions = useHandler(async () => {
    const client = await getClient()
    const connections: WcConnectionInfo[] = []
    const sessions = client.getActiveSessions()
    const accounts = await getAccounts(currencyWallets)
    for (const sessionName of Object.keys(sessions)) {
      const session = sessions[sessionName]
      const walletId = getWalletIdFromSessionNamespace(session.namespaces, accounts)
      if (walletId == null) continue

      const connection = parseConnection(session, walletId)
      connections.push(connection)
    }
    return connections
  })

  const initSession = useHandler(async (uri: string): Promise<any> => {
    const client = await getClient()

    const parsedUri = parseUri(uri)
    if (parsedUri.version !== 2) {
      throw new Error('Unsupported WalletConnect version')
    }

    return await runWithTimeout(
      new Promise((resolve, reject) => {
        client.once('session_proposal', async proposal => {
          const topic = proposal.params.pairingTopic
          if (topic == null) {
            console.log('walletConnect initSession no topic returned')
            reject(Error('initSession no topic returned'))
            return
          }

          resolve(proposal)
        })
        client.core.pairing.pair({ uri, activatePairing: true }).catch(e => {
          reject(e)
        })
      }),
      20000
    )
  })

  const approveSession = useHandler(async (proposal: Web3WalletTypes.SessionProposal, walletId: string) => {
    const client = await getClient()

    const wallet = currencyWallets[walletId]
    if (wallet == null) return

    const chainId = SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId].walletConnectV2ChainId
    if (chainId == null) return

    const address = await wallet.getReceiveAddress()
    const supportedNamespaces = getSupportedNamespaces(chainId, address.publicAddress)

    // Check that we support all required methods
    const unsupportedMethods = proposal.params.requiredNamespaces[chainId.namespace].methods.filter(method => {
      return !supportedNamespaces[chainId.namespace].methods.includes(method)
    })
    if (unsupportedMethods.length > 0) {
      throw new Error(`Required methods unimplemented: ${unsupportedMethods.join(',')}`)
    }

    await runWithTimeout(
      client.approveSession({
        id: proposal.id,
        namespaces: buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces
        })
      }),
      20000
    )
  })

  const rejectSession = useHandler(async (proposal: Web3WalletTypes.SessionProposal): Promise<void> => {
    const client = await getClient()
    await client.rejectSession({ id: proposal.id, reason: getSdkError('USER_REJECTED') }).catch(e => {
      console.log('walletConnect rejectSession error', String(e))
    })
  })

  const disconnectSession = useHandler(async (topic: string): Promise<void> => {
    const client = await getClient()
    const sessions = client.getActiveSessions()
    const session = sessions[topic]
    const dAppName = session?.peer.metadata.name ?? lstrings.wc_smartcontract_dapp

    // In testing, this method is pretty unreliable. May be worth replacing with something more manual.
    await runWithTimeout(client.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') }), 10000)
    Airship.show(bridge => <FlashNotification bridge={bridge} message={sprintf(lstrings.wc_dapp_disconnected, dAppName)} onPress={() => {}} />).catch(e =>
      console.log(e)
    )
  })

  const approveRequest = useHandler(async (topic: string, id: number, result: JsonObject | string) => {
    const client = await getClient()
    await client.respondSessionRequest({ topic, response: { id, jsonrpc: '2.0', result } }).catch(e => {
      console.log('walletConnect approveRequest error', String(e))
    })
  })

  const rejectRequest = useHandler(async (topic: string, id: number) => {
    const client = await getClient()
    await client
      .respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED_METHODS')
        }
      })
      .catch(e => {
        console.log('walletConnect rejectRequest error', String(e))
      })
  })

  return React.useMemo(
    () => ({
      getActiveSessions,
      initSession,
      approveSession,
      rejectSession,
      disconnectSession,
      approveRequest,
      rejectRequest
    }),
    [getActiveSessions, initSession, approveSession, rejectSession, disconnectSession, approveRequest, rejectRequest]
  )
}

// Utilities
const getSupportedNamespaces = (chainId: WalletConnectChainId, addr: string) => {
  const { namespace, reference } = chainId

  let methods: string[]
  switch (namespace) {
    case 'eip155':
      methods = [
        'personal_sign',
        'eth_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sendRawTransaction'
      ]
      break

    case 'algorand':
      methods = ['algo_signTxn']
  }

  return {
    [namespace]: {
      chains: [`${namespace}:${reference}`],
      methods,
      events: ['chainChanged', 'accountsChanged'],
      accounts: [`${namespace}:${reference}:${addr}`]
    }
  }
}

export const getAccounts = async (currencyWallets: { [walletId: string]: EdgeCurrencyWallet }) => {
  const map = new Map<string, string>()
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const chainId = SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId].walletConnectV2ChainId
    if (chainId == null) continue

    const address = await currencyWallets[walletId].getReceiveAddress()
    const account = `${chainId.namespace}:${chainId.reference}:${address.publicAddress}`
    map.set(account, walletId)
  }
  return map
}

export const getWalletIdFromSessionNamespace = (namespaces: SessionTypes.Namespaces, accounts: Map<string, string>): string | undefined => {
  for (const networkName of Object.keys(namespaces)) {
    const [namespace, reference, address] = namespaces[networkName].accounts[0].split(':')
    const account = `${namespace}:${reference}:${address}`

    const walletId = accounts.get(account)
    if (walletId != null) return walletId
  }
}
