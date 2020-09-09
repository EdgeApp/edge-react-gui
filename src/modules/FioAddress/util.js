// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { FIO_STR, FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import type { CcWalletMap } from '../../reducers/FioReducer'
import type { FioConnectionWalletItem, FioDomain, FioObtRecord, GuiWallet } from '../../types/types'
import { truncateDecimals } from '../../util/utils'

const CONNECTED_WALLETS = 'ConnectedWallets.json'
const FIO_ADDRESS_CACHE = 'FioAddressCache.json'

type DiskletConnectedWallets = {
  [fullCurrencyCode: string]: {
    walletId: string,
    publicAddress: string
  }
}

type BuyAddressResponse = {
  error: any,
  success: {
    charge: {
      pricing: {
        [currencyCode: string]: {
          amount: string,
          currency: string
        }
      },
      addresses: {
        [currencyCode: string]: string
      }
    }
  }
}

export type FioAddresses = {
  addresses: {
    [address: string]: boolean
  }
}

export const FIO_NO_BUNDLED_ERR_CODE = 'FIO_NO_BUNDLED_ERR_CODE'
export class FioError extends Error {
  code: string
  message: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'FioError'
  }
}
/**
 * Get connected wallets from disklet
 *
 * @param fioWallet
 * @returns {Promise<*>}
 */
const getConnectedWalletsFromFile = async (fioWallet: EdgeCurrencyWallet): Promise<{ [fioAddress: string]: DiskletConnectedWallets }> => {
  try {
    const savedConnectedWalletsText = await fioWallet.disklet.getText(CONNECTED_WALLETS)
    return JSON.parse(savedConnectedWalletsText)
  } catch (e) {
    return {}
  }
}

/**
 * Get connected wallets for FIO Address from disklet
 *
 * @param fioWallet
 * @param fioAddress
 * @returns {Promise<*>}
 */
const getConnectedWalletsForFioAddress = async (fioWallet: EdgeCurrencyWallet, fioAddress: string): Promise<DiskletConnectedWallets> => {
  const savedConnectedWallets = await getConnectedWalletsFromFile(fioWallet)
  return savedConnectedWallets[fioAddress] || {}
}

/**
 * Set connected wallets to disklet
 *
 * @param fioWallet
 * @param fioAddress
 * @param connectedWallets
 * @returns {Promise<void>}
 */
const setConnectedWalletsFromFile = async (fioWallet: EdgeCurrencyWallet, fioAddress: string, connectedWallets: DiskletConnectedWallets): Promise<void> => {
  try {
    const savedConnectedWallets = await getConnectedWalletsFromFile(fioWallet)
    savedConnectedWallets[fioAddress] = connectedWallets
    await fioWallet.disklet.setText(CONNECTED_WALLETS, JSON.stringify(savedConnectedWallets))
  } catch (e) {
    console.log('setConnectedWalletsFromFile error - ', e)
  }
}

/**
 * Check if wallet is connected to FIO Address
 *
 * @param fioWallet
 * @param fioAddress
 * @param wallet
 * @param tokenCode
 * @param chainCode
 * @param connectedWalletsFromDisklet
 * @returns {Promise<string>}
 */
const isWalletConnected = async (
  fioWallet: EdgeCurrencyWallet,
  fioAddress: string,
  wallet: EdgeCurrencyWallet,
  tokenCode: string,
  chainCode: string,
  connectedWalletsFromDisklet: DiskletConnectedWallets
): Promise<boolean> => {
  try {
    const { public_address: publicAddress } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
      fioAddress,
      tokenCode,
      chainCode
    })

    if (publicAddress === '0') return false

    const receiveAddress = await wallet.getReceiveAddress()
    if (publicAddress === receiveAddress.publicAddress) return true

    const fullCurrencyCode = `${chainCode}:${tokenCode}`
    if (connectedWalletsFromDisklet[fullCurrencyCode]) {
      const { walletId, publicAddress: pubAddressFromDisklet } = connectedWalletsFromDisklet[fullCurrencyCode]
      if (walletId === wallet.id && publicAddress === pubAddressFromDisklet) {
        return true
      }
    }
  } catch (e) {
    //
  }
  return false
}

/**
 * Set connected public addresses with FIO Address for all wallets in account
 *
 * @param fioAddress
 * @param fioWallet
 * @param wallets
 * @returns {Promise<CcWalletMap>}
 */
export const refreshConnectedWalletsForFioAddress = async (
  fioAddress: string,
  fioWallet: EdgeCurrencyWallet,
  wallets: EdgeCurrencyWallet[]
): Promise<CcWalletMap> => {
  const connectedWallets = {}
  const connectedWalletsFromDisklet = await getConnectedWalletsForFioAddress(fioWallet, fioAddress)
  for (const wallet of wallets) {
    const enabledTokens = await wallet.getEnabledTokens()
    if (!enabledTokens.find((enabledToken: string) => enabledToken === wallet.currencyInfo.currencyCode)) {
      enabledTokens.push(wallet.currencyInfo.currencyCode)
    }
    for (const enabledToken: string of enabledTokens) {
      const fullCurrencyCode = `${wallet.currencyInfo.currencyCode}:${enabledToken}`
      if (connectedWallets[fullCurrencyCode]) continue
      if (await isWalletConnected(fioWallet, fioAddress, wallet, enabledToken, wallet.currencyInfo.currencyCode, connectedWalletsFromDisklet)) {
        connectedWallets[fullCurrencyCode] = wallet.id
      }
    }
  }
  return connectedWallets
}

/**
 * Update public addresses for FIO Address
 *
 * @param fioWallet
 * @param fioAddress
 * @param publicAddresses
 * @returns {Promise<void>}
 */
export const updatePubAddressesForFioAddress = async (
  fioWallet: EdgeCurrencyWallet | null,
  fioAddress: string,
  publicAddresses: { walletId: string, chainCode: string, tokenCode: string, publicAddress: string }[]
) => {
  if (!fioWallet) throw new Error(s.strings.fio_connect_wallets_err)
  const connectedWalletsFromDisklet = await getConnectedWalletsForFioAddress(fioWallet, fioAddress)
  let publicAddressesToConnect = []
  const limitPerCall = 5
  for (const { walletId, chainCode, tokenCode, publicAddress } of publicAddresses) {
    const fullCurrencyCode = `${chainCode}:${tokenCode}`
    connectedWalletsFromDisklet[fullCurrencyCode] = { walletId, publicAddress }
    publicAddressesToConnect.push({
      token_code: tokenCode,
      chain_code: chainCode,
      public_address: publicAddress
    })
    if (publicAddressesToConnect.length === limitPerCall) {
      await addPublicAddresses(fioWallet, fioAddress, publicAddressesToConnect)
      await setConnectedWalletsFromFile(fioWallet, fioAddress, connectedWalletsFromDisklet)
      publicAddressesToConnect = []
    }
  }

  if (publicAddressesToConnect.length) {
    await addPublicAddresses(fioWallet, fioAddress, publicAddressesToConnect)
    await setConnectedWalletsFromFile(fioWallet, fioAddress, connectedWalletsFromDisklet)
  }
}

/**
 * Add public addresses for FIO Address API call method
 *
 * @param fioWallet
 * @param fioAddress
 * @param publicAddresses
 * @returns {Promise<void>}
 */
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

/**
 * Search for FIO Wallet that has FIO Address
 *
 * @param fioWallets
 * @param fioAddress
 * @returns {Promise<*>}
 */
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

export const makeConnectWallets = (wallets: { [walletId: string]: GuiWallet }, ccWalletMap: CcWalletMap): { [key: string]: FioConnectionWalletItem } => {
  const walletItems = {}
  for (const walletKey: string in wallets) {
    if (wallets[walletKey].type === FIO_WALLET_TYPE) continue
    const publicAddress = wallets[walletKey].receiveAddress.publicAddress
    const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${wallets[walletKey].currencyCode}`
    walletItems[`${wallets[walletKey].id}-${wallets[walletKey].currencyCode}`] = {
      key: `${wallets[walletKey].id}-${wallets[walletKey].currencyCode}`,
      id: wallets[walletKey].id,
      publicAddress,
      symbolImage: wallets[walletKey].symbolImage,
      name: wallets[walletKey].name,
      currencyCode: wallets[walletKey].currencyCode,
      chainCode: wallets[walletKey].currencyCode,
      fullCurrencyCode,
      isConnected: ccWalletMap[fullCurrencyCode] === wallets[walletKey].id
    }
    if (wallets[walletKey].enabledTokens && wallets[walletKey].enabledTokens.length) {
      for (const enabledToken: string of wallets[walletKey].enabledTokens) {
        let tokenData = wallets[walletKey].metaTokens.find(metaToken => metaToken.currencyCode === enabledToken)
        if (!tokenData) {
          tokenData = {
            currencyCode: enabledToken,
            symbolImage: ''
          }
        }
        const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${tokenData.currencyCode}`
        walletItems[`${wallets[walletKey].id}-${tokenData.currencyCode}`] = {
          key: `${wallets[walletKey].id}-${tokenData.currencyCode}`,
          id: wallets[walletKey].id,
          publicAddress,
          symbolImage: tokenData.symbolImage,
          name: wallets[walletKey].name,
          currencyCode: tokenData.currencyCode,
          chainCode: wallets[walletKey].currencyCode,
          fullCurrencyCode,
          isConnected: ccWalletMap[fullCurrencyCode] === wallets[walletKey].id
        }
      }
    }
  }

  return walletItems
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

export const addToFioAddressCache = async (account: EdgeAccount, fioAddressesToAdd: string[]): Promise<FioAddresses> => {
  const fioAddressesObject = await getFioAddressCache(account)
  let writeToDisklet = false

  for (const fioAddressToAdd of fioAddressesToAdd) {
    if (!fioAddressesObject.addresses[fioAddressToAdd]) {
      fioAddressesObject.addresses[fioAddressToAdd] = true
      writeToDisklet = true
    }
  }

  if (writeToDisklet) {
    await account.disklet.setText(FIO_ADDRESS_CACHE, JSON.stringify(fioAddressesObject))
  }
  return fioAddressesObject
}

export const getFioAddressCache = async (account: EdgeAccount): Promise<FioAddresses> => {
  try {
    const fioAddressObject = await account.disklet.getText(FIO_ADDRESS_CACHE)
    return JSON.parse(fioAddressObject)
  } catch (e) {
    return { addresses: {} }
  }
}

export const checkRecordSendFee = async (fioWallet: EdgeCurrencyWallet, fioAddress: string) => {
  let getFeeResult
  try {
    getFeeResult = await fioWallet.otherMethods.fioAction('getFee', {
      endPoint: 'record_obt_data',
      fioAddress: fioAddress
    })
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  if (getFeeResult.fee !== 0) {
    throw new FioError(`${s.strings.fio_no_bundled_err_msg} ${s.strings.fio_no_bundled_renew_err_msg}`, FIO_NO_BUNDLED_ERR_CODE)
  }
}

export const recordSend = async (
  senderWallet: EdgeCurrencyWallet,
  senderFioAddress: string,
  params: {
    payeeFioAddress: string,
    payerPublicAddress: string,
    payeePublicAddress: string,
    amount: string,
    currencyCode: string,
    chainCode: string,
    txid: string,
    memo: string,
    fioRequestId?: string
  }
) => {
  const { payeeFioAddress, payerPublicAddress, payeePublicAddress, amount, currencyCode, chainCode, txid, memo, fioRequestId } = params
  if (senderFioAddress && senderWallet && payeePublicAddress) {
    let actionParams = {
      payerFioAddress: senderFioAddress,
      payeeFioAddress,
      payerPublicAddress,
      payeePublicAddress,
      amount,
      tokenCode: currencyCode,
      chainCode,
      obtId: txid,
      memo,
      maxFee: 0,
      status: 'sent_to_blockchain'
    }
    if (fioRequestId) {
      actionParams = { ...actionParams, fioRequestId }
    }
    try {
      await senderWallet.otherMethods.fioAction('recordObtData', actionParams)
    } catch (e) {
      //
      throw new Error(e.message)
    }
  }
}

export const getFioObtData = async (fioWallets: EdgeCurrencyWallet[]): Promise<FioObtRecord[]> => {
  let obtDataRecords = []
  for (const fioWallet: EdgeCurrencyWallet of fioWallets) {
    try {
      const { obt_data_records } = await fioWallet.otherMethods.fioAction('getObtData', {})
      obtDataRecords = [...obtDataRecords, ...obt_data_records]
    } catch (e) {
      //
    }
  }

  return obtDataRecords
}

export const getFioDomains = async (fioPlugin: EdgeCurrencyConfig, fioAddress: string, chainCode: string, tokenCode: string): Promise<string> => {
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

/**
 *
 * @param fioPlugin
 * @param fioAddress
 * @param selectedWallet
 * @param selectedDomain
 * @param displayDenomination
 * @param isFallback
 * @returns {Promise<{activationCost: number, supportedCurrencies:{[string]: boolean}, paymentInfo: {[string]: {amount: string, address: string}}}>}
 */
export const getRegInfo = async (
  fioPlugin: EdgeCurrencyConfig,
  fioAddress: string,
  selectedWallet: EdgeCurrencyWallet,
  selectedDomain: FioDomain,
  displayDenomination: EdgeDenomination,
  isFallback: boolean = false
): Promise<{
  supportedCurrencies: { [currencyCode: string]: boolean },
  activationCost: number,
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } }
}> => {
  let activationCost = 0

  try {
    const fee = await selectedWallet.otherMethods.getFee('registerFioAddress')
    activationCost = parseFloat(truncateDecimals(bns.div(`${fee}`, displayDenomination.multiplier, 18), 6))
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }

  if (selectedDomain.walletId) {
    return {
      activationCost,
      supportedCurrencies: { [FIO_STR]: true },
      paymentInfo: {
        [FIO_STR]: {
          amount: `${activationCost}`,
          nativeAmount: '',
          address: ''
        }
      }
    }
  }

  try {
    // todo: temporary commented to use fallback referral code by default.
    // const referralCode = isFallback ? fioPlugin.currencyInfo.defaultSettings.fallbackRef : fioPlugin.currencyInfo.defaultSettings.defaultRef
    const buyAddressResponse: BuyAddressResponse = await fioPlugin.otherMethods.buyAddressRequest({
      address: fioAddress,
      referralCode: fioPlugin.currencyInfo.defaultSettings.fallbackRef,
      publicKey: selectedWallet.publicWalletInfo.keys.publicKey
    })

    if (buyAddressResponse.error) {
      console.log(buyAddressResponse.error)
      throw new Error(s.strings.fio_get_reg_info_err_msg)
    }

    if (buyAddressResponse.success) {
      const supportedCurrencies = { [FIO_STR]: true }
      const paymentInfo = {
        [FIO_STR]: {
          amount: `${activationCost}`,
          nativeAmount: '',
          address: ''
        }
      }

      for (const currencyKey in buyAddressResponse.success.charge.pricing) {
        const currencyCode = buyAddressResponse.success.charge.pricing[currencyKey].currency
        supportedCurrencies[currencyCode] = true

        paymentInfo[currencyCode] = {
          amount: buyAddressResponse.success.charge.pricing[currencyKey].amount,
          address: buyAddressResponse.success.charge.addresses[currencyKey]
        }
      }

      return {
        activationCost,
        supportedCurrencies,
        paymentInfo
      }
    }
  } catch (e) {
    console.log(e)
  }

  throw new Error(s.strings.fio_get_reg_info_err_msg)
}

export const getRenewalFee = async (fioWallet: EdgeCurrencyWallet | null, forDomain: boolean = false): Promise<number> => {
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', {
        endPoint: forDomain ? 'renew_fio_domain' : 'renew_fio_address',
        fioAddress: ''
      })

      return fee
    } catch (e) {
      throw new Error(s.strings.fio_get_fee_err_msg)
    }
  }
  throw new Error(s.strings.fio_get_fee_err_msg)
}

export const renewFioName = async (
  fioWallet: EdgeCurrencyWallet | null,
  fioName: string,
  fee: number,
  isDomain: boolean = false
): Promise<{ expiration: string }> => {
  const errorStr = sprintf(s.strings.fio_renew_err_msg, isDomain ? s.strings.fio_domain_label : s.strings.fio_address_register_form_field_label)
  if (fioWallet) {
    try {
      let params = {}
      if (isDomain) {
        params = { fioDomain: fioName, maxFee: fee }
      } else {
        params = { fioAddress: fioName, maxFee: fee }
      }
      const { expiration } = await fioWallet.otherMethods.fioAction(isDomain ? 'renewFioDomain' : 'renewFioAddress', params)
      return { expiration }
    } catch (e) {
      throw new Error(errorStr)
    }
  }
  throw new Error(errorStr)
}
