import '@walletconnect/react-native-compat'

import { Core } from '@walletconnect/core'
import type { SessionTypes } from '@walletconnect/types'
import Web3Wallet, { type Web3WalletTypes } from '@walletconnect/web3wallet'
import { asNumber, asObject, asOptional, asString, asUnknown } from 'cleaners'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import {
  getAccounts,
  getClient,
  resolveSessionWalletId,
  useWalletConnect,
  waitingClients,
  walletConnectClient
} from '../../hooks/useWalletConnect'
import { asLegacyTokenId } from '../../types/types'
import { snooze } from '../../util/utils'
import { WcSignMessageModal } from '../modals/WcSignMessageModal'
import { WcSmartContractModal } from '../modals/WcSmartContractModal'
import { Airship, showError } from '../services/AirshipInstance'

const TWO_SECONDS = 2000

interface Props {
  account: EdgeAccount
}

export const WalletConnectService: React.FC<Props> = props => {
  const { account } = props

  const walletConnect = useWalletConnect()

  /**
   * Serves the bip122 methods this wallet advertises when it approves a
   * session. bip122 signing is not a transaction, so it never reaches the
   * plugin's WalletConnect payload parser the way an EVM or Cosmos request
   * does.
   */
  const handleBip122Request = async (
    request: ReturnType<typeof asSessionRequest>,
    session: SessionTypes.Struct,
    wallet: EdgeCurrencyWallet
  ): Promise<void> => {
    const { id: requestId, topic } = request
    const payload = asBip122Payload(request.params.request)

    // The address this wallet advertised when the session was approved. The
    // dapp verifies the signature against that exact string, so deriving a
    // fresh address here would hand it a signature it cannot verify.
    const sessionAccount = session.namespaces.bip122?.accounts[0]
    const publicAddress = sessionAccount?.split(':')[2]
    if (publicAddress == null) {
      await walletConnect.rejectRequest(topic, requestId)
      return
    }

    switch (payload.method) {
      case 'getAccountAddresses': {
        // Approving the session already disclosed this address, so handing it
        // back needs no second approval.
        await walletConnect.approveRequest(topic, requestId, [
          { address: publicAddress }
        ])
        return
      }
      case 'signMessage': {
        const { account: requestedAccount, message } =
          asBip122SignMessageParams(payload.params)
        // A dapp may name the account it wants signed for. Edge holds one
        // address per session, so anything else is unservable.
        if (requestedAccount != null && requestedAccount !== publicAddress) {
          await walletConnect.rejectRequest(topic, requestId)
          return
        }

        const iconUri = session.peer.metadata.icons[0] ?? '.svg'
        const dAppIcon = iconUri.endsWith('.svg')
          ? 'https://content.edge.app/walletConnectLogo.png'
          : iconUri
        await Airship.show(bridge => (
          <WcSignMessageModal
            bridge={bridge}
            dAppIcon={dAppIcon}
            dAppName={session.peer.metadata.name}
            message={message}
            publicAddress={publicAddress}
            requestId={requestId}
            topic={topic}
            wallet={wallet}
          />
        ))
        return
      }
      default: {
        await walletConnect.rejectRequest(topic, requestId)
      }
    }
  }

  const handleSessionRequest = async (
    event: Web3WalletTypes.SessionRequest
  ): Promise<void> => {
    const client = await getClient()
    const request = asSessionRequest(event)

    const sessions = client.getActiveSessions()
    const session = sessions[request.topic]
    if (session == null) return
    const { currencyWallets } = account
    const accounts = await getAccounts(currencyWallets)
    const walletId = await resolveSessionWalletId(account, session, accounts)
    const wallet = walletId == null ? undefined : currencyWallets[walletId]
    if (wallet == null) {
      // Leaving the request unanswered would hang the dapp until its own
      // timeout, so say no rather than dropping it.
      console.log('walletConnect unrecognized session request')
      await walletConnect.rejectRequest(request.topic, request.id)
      return
    }

    const [namespace] = request.params.chainId.split(':')
    if (namespace === 'bip122') {
      // A malformed payload throws out of the cleaners below. Reject the
      // request before surfacing the error, so the dapp is not left waiting.
      await handleBip122Request(request, session, wallet).catch(
        async (error: unknown) => {
          await walletConnect.rejectRequest(request.topic, request.id)
          throw error
        }
      )
      return
    }

    if (wallet.otherMethods.parseWalletConnectV2Payload == null) return
    try {
      const parsedPayload =
        await wallet.otherMethods.parseWalletConnectV2Payload(
          request.params.request
        )
      const { nativeAmount, networkFee, tokenId } =
        payloadAmounts(parsedPayload)
      const iconUri = session.peer.metadata.icons[0] ?? '.svg'
      const icon = iconUri.endsWith('.svg')
        ? 'https://content.edge.app/walletConnectLogo.png'
        : iconUri
      const dApp = {
        peerMeta: { name: session.peer.metadata.name, icons: [icon] }
      }
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
        if (
          typeof ENV.WALLET_CONNECT_INIT === 'object' &&
          ENV.WALLET_CONNECT_INIT.projectId != null
        ) {
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
      const handleSessionRequestSync = (
        event: Web3WalletTypes.SessionRequest
      ): void => {
        handleSessionRequest(event).catch((err: unknown) => {
          showError(err)
        })
      }

      if (
        walletConnectClient.client?.events.listenerCount('session_request') ===
        0
      ) {
        walletConnectClient.client.on(
          'session_request',
          handleSessionRequestSync
        )
      }
      console.log('WalletConnect initialized')
      waitingClients.forEach(f => {
        f(walletConnectClient.client!)
      })

      return () => {
        walletConnectClient.client?.events.removeListener(
          'session_request',
          handleSessionRequestSync
        )
      }
    },
    [],
    'WalletConnectService'
  )

  return null
}

// Cleaners
const payloadAmounts = asObject({
  nativeAmount: asString,
  networkFee: asString,
  tokenId: asLegacyTokenId
})
const asSessionRequest = asObject({
  id: asNumber,
  topic: asString,
  params: asObject({
    request: asUnknown,
    chainId: asString
  })
})
const asBip122Payload = asObject({
  method: asString,
  params: asUnknown
})
const asBip122SignMessageParams = asObject({
  message: asString,
  account: asOptional(asString)
})
