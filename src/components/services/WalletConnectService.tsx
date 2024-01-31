import '@walletconnect/react-native-compat'

import { Core } from '@walletconnect/core'
import Web3Wallet, { Web3WalletTypes } from '@walletconnect/web3wallet'
import { asNumber, asObject, asString, asUnknown } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { getAccounts, getClient, getWalletIdFromSessionNamespace, waitingClients, walletConnectClient } from '../../hooks/useWalletConnect'
import { asLegacyTokenId } from '../../types/types'
import { snooze } from '../../util/utils'
import { WcSmartContractModal } from '../modals/WcSmartContractModal'
import { Airship, showError } from '../services/AirshipInstance'

const TWO_SECONDS = 2000

interface Props {
  account: EdgeAccount
}

export const WalletConnectService = (props: Props) => {
  const { account } = props

  const handleSessionRequest = async (event: any) => {
    const client = await getClient()
    const request = asSessionRequest(event)

    const sessions = client.getActiveSessions()
    const session = sessions[request.topic]
    if (session == null) return
    const { currencyWallets } = account
    const accounts = await getAccounts(currencyWallets)
    const walletId = getWalletIdFromSessionNamespace(session.namespaces, accounts)
    if (walletId == null) {
      console.log('walletConnect unrecognized session request')
      return
    }

    const wallet = currencyWallets[walletId]
    if (wallet.otherMethods.parseWalletConnectV2Payload == null) return
    try {
      const parsedPayload = await wallet.otherMethods.parseWalletConnectV2Payload(request.params.request)
      const { nativeAmount, networkFee, tokenId } = payloadAmounts(parsedPayload)
      const iconUri = session.peer.metadata.icons[0] ?? '.svg'
      const icon = iconUri.endsWith('.svg') ? 'https://content.edge.app/walletConnectLogo.png' : iconUri
      const dApp = { peerMeta: { name: session.peer.metadata.name, icons: [icon] } }
      await Airship.show(bridge => (
        <WcSmartContractModal
          bridge={bridge}
          dApp={dApp}
          nativeAmount={nativeAmount}
          networkFee={networkFee}
          payload={request.params.request}
          requestId={request.id}
          tokenId={tokenId}
          topic={request.topic}
          wallet={wallet}
        />
      ))
    } catch (e: any) {
      console.warn('Invalid walletConnect session params', e)
    }
  }

  useAsyncEffect(
    async () => {
      if (walletConnectClient.client == null) {
        let projectId: string | undefined
        if (typeof ENV.WALLET_CONNECT_INIT === 'object' && ENV.WALLET_CONNECT_INIT.projectId != null) {
          projectId = ENV.WALLET_CONNECT_INIT.projectId
        }

        // If init fails, retry every 2 seconds
        let retrySeconds = 0
        while (walletConnectClient.client == null) {
          try {
            await snooze(retrySeconds)
            walletConnectClient.client = await Web3Wallet.init({
              core: new Core({
                projectId
              }),
              metadata: {
                name: 'Edge Wallet',
                description: 'Edge Wallet',
                url: 'https://www.edge.app',
                icons: ['https://content.edge.app/Edge_logo_Icon.png']
              }
            })
          } catch (e) {
            console.error('WalletConnectService init error', e)
            if (retrySeconds < TWO_SECONDS) retrySeconds = TWO_SECONDS
          }
        }
      }
      const handleSessionRequestSync = (event: Web3WalletTypes.SessionRequest) => {
        handleSessionRequest(event).catch(err => showError(err))
      }

      if (walletConnectClient.client?.events.listenerCount('session_request') === 0) {
        walletConnectClient.client.on('session_request', handleSessionRequestSync)
      }
      console.log('WalletConnect initialized')
      waitingClients.forEach(f => f(walletConnectClient.client as Web3Wallet))

      return () => {
        walletConnectClient.client?.events.removeListener('session_request', handleSessionRequestSync)
      }
    },
    [],
    'WalletConnectService'
  )

  return null
}

// Cleaners
const payloadAmounts = asObject({ nativeAmount: asString, networkFee: asString, tokenId: asLegacyTokenId })
const asSessionRequest = asObject({
  id: asNumber,
  topic: asString,
  params: asObject({
    request: asUnknown,
    chainId: asString
  })
})
