import '@walletconnect/react-native-compat'

import { Core } from '@walletconnect/core'
import Web3Wallet from '@walletconnect/web3wallet'
import { asNumber, asObject, asOptional, asString, asUnknown } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { ENV } from '../../env'
import { useMount } from '../../hooks/useMount'
import { getAccounts, getWalletIdFromSessionNamespace } from '../../hooks/useWalletConnect'
import { useWatch } from '../../hooks/useWatch'
import { WcSmartContractModal } from '../modals/WcSmartContractModal'
import { Airship } from '../services/AirshipInstance'

let walletConnectRef: Web3Wallet | undefined

export const walletConnectPromise: Promise<Web3Wallet> = new Promise((resolve, reject) => {
  if (walletConnectRef != null) {
    resolve(walletConnectRef)
    return
  }

  if (typeof ENV.WALLET_CONNECT_INIT !== 'object' || ENV.WALLET_CONNECT_INIT.projectId == null) {
    const message = 'Cannot initialize WalletConnect without projectId'
    console.warn(message)
    reject(message)
    return
  }

  const core = new Core({
    projectId: ENV.WALLET_CONNECT_INIT.projectId
  })

  Web3Wallet.init({
    core,
    metadata: {
      name: 'Edge Wallet',
      description: 'Edge Wallet',
      url: 'https://www.edge.app',
      icons: ['https://content.edge.app/Edge_logo_Icon.png']
    }
  })
    .then(res => {
      walletConnectRef = res
      console.log('WalletConnect initialized')
      resolve(walletConnectRef)
    })
    .catch(error => reject(error))
})

interface Props {
  account: EdgeAccount
}

export const WalletConnectService = (props: Props) => {
  const { account } = props
  const currencyWallets = useWatch(account, 'currencyWallets')

  const handleSessionRequest = async (event: any) => {
    if (walletConnectRef == null) return
    const client = walletConnectRef
    const request = asSessionRequest(event)

    const sessions = client.getActiveSessions()
    const session = sessions[request.topic]
    if (session == null) return
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
      Airship.show(bridge => (
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

  useMount(async () => {
    const client = await walletConnectPromise
    if (client.events.listenerCount('session_request') === 0) {
      client.on('session_request', handleSessionRequest)
    }
  })

  return null
}

// Cleaners
const payloadAmounts = asObject({ nativeAmount: asString, networkFee: asString, tokenId: asOptional(asString) })
const asSessionRequest = asObject({
  id: asNumber,
  topic: asString,
  params: asObject({
    request: asUnknown,
    chainId: asString
  })
})
