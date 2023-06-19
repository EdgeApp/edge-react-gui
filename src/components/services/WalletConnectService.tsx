import '@walletconnect/react-native-compat'

import { Core } from '@walletconnect/core'
import Web3Wallet from '@walletconnect/web3wallet'

import { ENV } from '../../env'
import { useMount } from '../../hooks/useMount'
import { showError } from '../services/AirshipInstance'

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

  return Web3Wallet.init({
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

export const WalletConnectService = () => {
  const initWalletConnect = async () => {
    return await walletConnectPromise
  }

  useMount(async () => {
    initWalletConnect().catch(error => showError(error))
  })

  return null
}
