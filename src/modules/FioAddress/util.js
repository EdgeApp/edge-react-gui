// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
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

export const updatePubAddressesForFioAddress = async (
  fioWallet: EdgeCurrencyWallet | null,
  fioAddress: string,
  publicAddresses: { chainCode: string, tokenCode: string, publicAddress: string }[]
) => {
  if (!fioWallet) throw new Error(s.strings.fio_connect_wallets_err)
  let publicAddressesToConnect = []
  const limitPerCall = 5
  for (const { chainCode, tokenCode, publicAddress } of publicAddresses) {
    publicAddressesToConnect.push({
      token_code: tokenCode,
      chain_code: chainCode,
      public_address: publicAddress
    })
    if (publicAddressesToConnect.length === limitPerCall) {
      await addPublicAddresses(fioWallet, fioAddress, publicAddressesToConnect)
      publicAddressesToConnect = []
    }
  }

  if (publicAddressesToConnect.length) {
    await addPublicAddresses(fioWallet, fioAddress, publicAddressesToConnect)
  }
}

export const addPublicAddresses = async (
  fioWallet: EdgeCurrencyWallet,
  fioAddress: string,
  publicAddresses: { token_code: string, chain_code: string, public_address: string }[]
) => {
  let maxFee: number
  try {
    const { fee } = await fioWallet.otherMethods.fioAction('getFeeForAddPublicAddress', {
      fioAddress
    })
    maxFee = fee
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  try {
    await fioWallet.otherMethods.fioAction('addPublicAddresses', {
      fioAddress,
      publicAddresses,
      maxFee
    })
  } catch (e) {
    throw new Error(s.strings.fio_connect_wallets_err)
  }
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

export const makeConnectedWallets = (
  wallets: { [walletId: string]: GuiWallet },
  connectedPubAddresses: { [fullCurrencyCode: string]: string }
): { [key: string]: FioConnectionWalletItem } => {
  const connectedWallets = {}
  for (const walletKey: string in wallets) {
    if (wallets[walletKey].type === FIO_WALLET_TYPE) continue
    const publicAddress = wallets[walletKey].receiveAddress.publicAddress
    if (!publicAddress) continue
    const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${wallets[walletKey].currencyCode}`
    if (publicAddress === connectedPubAddresses[fullCurrencyCode]) {
      connectedWallets[`${wallets[walletKey].id}-${wallets[walletKey].currencyCode}`] = {
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
        if (publicAddress === connectedPubAddresses[fullCurrencyCode]) {
          connectedWallets[`${wallets[walletKey].id}-${tokenData.currencyCode}`] = {
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

  return connectedWallets
}

export const checkPubAddress = async (fioPlugin: EdgeCurrencyConfig, fioAddress: string, chainCode: string, tokenCode: string): Promise<string> => {
  const isFioAddress = await fioPlugin.otherMethods.isFioAddressValid(fioAddress)
  try {
    if (isFioAddress) {
      const { public_address: publicAddress } = await fioPlugin.otherMethods.getConnectedPublicAddress(fioAddress.toLowerCase(), chainCode, tokenCode)
      if (publicAddress && publicAddress.length > 1) {
        return publicAddress
      }
    }
  } catch (e) {
    throw new Error(s.strings.err_no_address_title)
  }

  return ''
}
