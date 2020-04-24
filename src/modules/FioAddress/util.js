// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import type { FioConnectionWalletItem, GuiWallet } from '../../types/types'

export const isPubAddressNotConnected = (pubAddress: string | null): boolean => {
  return !pubAddress || pubAddress === '0'
}

export const refreshPubAddressesForFioAddress = async (
  fioAddress: string,
  fioWallet: EdgeCurrencyWallet,
  wallets: EdgeCurrencyWallet[]
): { [fullCurrencyCode: string]: string } => {
  const pubAddresses = {}
  for (const wallet of wallets) {
    const enabledTokens = await wallet.getEnabledTokens()
    if (enabledTokens && enabledTokens.length) {
      for (const enabledToken: string of enabledTokens) {
        try {
          const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
            fioAddress,
            tokenCode: enabledToken,
            chainCode: wallet.currencyInfo.currencyCode
          })
          pubAddresses[`${wallet.currencyInfo.currencyCode}:${enabledToken}`] = public_address
        } catch (e) {
          //
          console.log(e.json)
        }
      }
    }
    const fullCurrencyCode = `${wallet.currencyInfo.currencyCode}:${wallet.currencyInfo.currencyCode}`
    if (pubAddresses[fullCurrencyCode] && pubAddresses[fullCurrencyCode] !== '0') continue
    try {
      const { public_address } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
        fioAddress,
        tokenCode: wallet.currencyInfo.currencyCode,
        chainCode: wallet.currencyInfo.currencyCode
      })
      pubAddresses[fullCurrencyCode] = public_address
    } catch (e) {
      //
      console.log(e.json)
    }
  }
  return pubAddresses
}

export const findWalletByFioAddress = async (fioWallets: EdgeCurrencyWallet[], fioAddress: string): Promise<EdgeCurrencyWallet | null> => {
  if (fioWallets) {
    for (const wallet: EdgeCurrencyWallet of fioWallets) {
      const fioAddresses: string[] = await wallet.otherMethods.getFioAddressNames()
      for (const address of fioAddresses) {
        if (address.toLowerCase() === fioAddress.toLowerCase()) {
          return wallet
        }
      }
    }
  }

  return null
}

export const makeNotConnectedWallets = (
  wallets: { [walletId: string]: GuiWallet },
  connectedPubAddresses: { [fullCurrencyCode: string]: string }
): { [key: string]: FioConnectionWalletItem } => {
  const notConnectedWallets = {}
  for (const walletKey: string in wallets) {
    if (wallets[walletKey].type === FIO_WALLET_TYPE) continue
    const publicAddress = wallets[walletKey].receiveAddress.publicAddress
    if (!publicAddress) continue
    const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${wallets[walletKey].currencyCode}`
    if (isPubAddressNotConnected(connectedPubAddresses[fullCurrencyCode])) {
      notConnectedWallets[`${wallets[walletKey].id}-${wallets[walletKey].currencyCode}`] = {
        key: `${wallets[walletKey].id}-${wallets[walletKey].currencyCode}`,
        id: wallets[walletKey].id,
        publicAddress,
        symbolImage: wallets[walletKey].symbolImage,
        name: wallets[walletKey].name,
        currencyCode: wallets[walletKey].currencyCode,
        chainCode: wallets[walletKey].currencyCode,
        fullCurrencyCode
      }
    }
    if (wallets[walletKey].enabledTokens && wallets[walletKey].enabledTokens.length) {
      for (const enabledToken: string of wallets[walletKey].enabledTokens) {
        const tokenData = wallets[walletKey].metaTokens.find(metaToken => metaToken.currencyCode === enabledToken)
        if (!tokenData) continue
        const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${tokenData.currencyCode}`
        if (isPubAddressNotConnected(connectedPubAddresses[fullCurrencyCode])) {
          notConnectedWallets[`${wallets[walletKey].id}-${tokenData.currencyCode}`] = {
            key: `${wallets[walletKey].id}-${tokenData.currencyCode}`,
            id: wallets[walletKey].id,
            publicAddress,
            symbolImage: tokenData.symbolImage,
            name: wallets[walletKey].name,
            currencyCode: tokenData.currencyCode,
            chainCode: wallets[walletKey].currencyCode,
            fullCurrencyCode
          }
        }
      }
    }
  }

  return notConnectedWallets
}
