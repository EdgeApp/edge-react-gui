// @flow

import { div } from 'biggystring'
import type { Disklet } from 'disklet'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { FIO_STR, FIO_WALLET_TYPE, getPluginId } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import type { CcWalletMap } from '../../reducers/FioReducer'
import type { FioAddress, FioConnectionWalletItem, FioDomain, FioObtRecord, GuiWallet } from '../../types/types'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../util/utils'

const CONNECTED_WALLETS = 'ConnectedWallets.json'
const FIO_ADDRESS_CACHE = 'FioAddressCache.json'
const FIO_EXPIRED_CHECK = 'FioExpiredCheck.json'
const MONTH = 1000 * 60 * 60 * 24 * 30
const DEFAULT_BUNDLE_SET_VALUE = 1

export const BUNDLED_TXS_AMOUNT_ALERT = 5

type DiskletConnectedWallets = {
  [fullCurrencyCode: string]: {
    walletId: string,
    publicAddress: string
  }
}

type BuyAddressResponse = {
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
export const FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM = 'Fee exceeds supplied maximum'
export const FIO_DOMAIN_IS_NOT_PUBLIC = 'FIO_DOMAIN_IS_NOT_PUBLIC'
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

export const getFioExpiredCheckFromDisklet = async (disklet: Disklet): Promise<{ [fioName: string]: Date }> => {
  try {
    const lastChecks = JSON.parse(await disklet.getText(FIO_EXPIRED_CHECK))
    return Object.keys(lastChecks).reduce((checkDates, fioName) => ({ ...checkDates, [fioName]: new Date(lastChecks[fioName]) }), {})
  } catch (error) {
    return {}
  }
}
export const setFioExpiredCheckToDisklet = async (lastChecks: { [fioName: string]: Date }, disklet: Disklet): Promise<void> => {
  try {
    await disklet.setText(FIO_EXPIRED_CHECK, JSON.stringify(lastChecks))
  } catch (error) {
    console.log(error)
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
    chainCode = chainCode.toUpperCase()
    tokenCode = tokenCode.toUpperCase()
    const { public_address: publicAddress } = await fioWallet.otherMethods.fioAction('getPublicAddress', {
      fioAddress,
      tokenCode,
      chainCode
    })

    if (zeroString(publicAddress)) return false

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
  publicAddresses: Array<{ walletId: string, chainCode: string, tokenCode: string, publicAddress: string }>,
  isConnection: boolean = true
): Promise<{ updatedCcWallets: Array<{ fullCurrencyCode: string, walletId: string }>, error?: Error | FioError | null }> => {
  if (!fioWallet) throw new Error(s.strings.fio_connect_wallets_err)
  const connectedWalletsFromDisklet = await getConnectedWalletsForFioAddress(fioWallet, fioAddress)
  let updatedCcWallets = []
  const iteration = {
    publicAddresses: [],
    ccWalletMap: []
  }
  const limitPerCall = 5
  for (const { walletId, chainCode: cCode, tokenCode: tCode, publicAddress } of publicAddresses) {
    const chainCode = cCode.toUpperCase()
    const tokenCode = tCode.toUpperCase()
    const fullCurrencyCode = `${chainCode}:${tokenCode}`
    let pubAddress = publicAddress

    if (isConnection) {
      connectedWalletsFromDisklet[fullCurrencyCode] = { walletId, publicAddress }
    } else {
      const { publicAddress: pubAddressFromStore } = connectedWalletsFromDisklet[fullCurrencyCode]
      if (pubAddressFromStore !== publicAddress) {
        pubAddress = pubAddressFromStore
      }
      delete connectedWalletsFromDisklet[fullCurrencyCode]
    }
    iteration.ccWalletMap.push({
      fullCurrencyCode,
      walletId
    })
    iteration.publicAddresses.push({
      token_code: tokenCode,
      chain_code: chainCode,
      public_address: pubAddress
    })
    if (iteration.publicAddresses.length === limitPerCall) {
      try {
        isConnection
          ? await addPublicAddresses(fioWallet, fioAddress, iteration.publicAddresses)
          : await removePublicAddresses(fioWallet, fioAddress, iteration.publicAddresses)
        await setConnectedWalletsFromFile(fioWallet, fioAddress, connectedWalletsFromDisklet)
        updatedCcWallets = [...updatedCcWallets, ...iteration.ccWalletMap]
        iteration.publicAddresses = []
        iteration.ccWalletMap = []
      } catch (e) {
        return { updatedCcWallets, error: e }
      }
    }
  }

  if (iteration.publicAddresses.length) {
    try {
      isConnection
        ? await addPublicAddresses(fioWallet, fioAddress, iteration.publicAddresses)
        : await removePublicAddresses(fioWallet, fioAddress, iteration.publicAddresses)
      await setConnectedWalletsFromFile(fioWallet, fioAddress, connectedWalletsFromDisklet)
      updatedCcWallets = [...updatedCcWallets, ...iteration.ccWalletMap]
    } catch (e) {
      return { updatedCcWallets, error: e }
    }
  }

  return { updatedCcWallets }
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
  publicAddresses: Array<{ token_code: string, chain_code: string, public_address: string }>
) => {
  let getFeeRes: { fee: number }
  try {
    getFeeRes = await fioWallet.otherMethods.fioAction('getFeeForAddPublicAddress', {
      fioAddress
    })
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  if (getFeeRes.fee) throw new FioError(s.strings.fio_no_bundled_err_msg, FIO_NO_BUNDLED_ERR_CODE)
  try {
    await fioWallet.otherMethods.fioAction('addPublicAddresses', {
      fioAddress,
      publicAddresses,
      maxFee: getFeeRes.fee
    })
  } catch (e) {
    throw new Error(s.strings.fio_connect_wallets_err)
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
export const removePublicAddresses = async (
  fioWallet: EdgeCurrencyWallet,
  fioAddress: string,
  publicAddresses: Array<{ token_code: string, chain_code: string, public_address: string }>
) => {
  let getFeeRes: { fee: number }
  try {
    getFeeRes = await fioWallet.otherMethods.fioAction('getFeeForRemovePublicAddresses', {
      fioAddress
    })
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  if (getFeeRes.fee) throw new FioError(s.strings.fio_no_bundled_err_msg, FIO_NO_BUNDLED_ERR_CODE)
  try {
    await fioWallet.otherMethods.fioAction('removePublicAddresses', {
      fioAddress,
      publicAddresses,
      maxFee: getFeeRes.fee
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
  for (const walletKey of Object.keys(wallets)) {
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
            symbolImage: '',
            contractAddress: undefined
          }
        }
        const fullCurrencyCode = `${wallets[walletKey].currencyCode}:${tokenData.currencyCode}`
        walletItems[`${wallets[walletKey].id}-${tokenData.currencyCode}`] = {
          key: `${wallets[walletKey].id}-${tokenData.currencyCode}`,
          id: wallets[walletKey].id,
          publicAddress,
          ...getCurrencyIcon(getPluginId(wallets[walletKey].type), tokenData.contractAddress),
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
  try {
    const { public_address: publicAddress } = await fioPlugin.otherMethods.getConnectedPublicAddress(fioAddress.toLowerCase(), chainCode, tokenCode)
    return publicAddress
  } catch (e) {
    if (e.labelCode && e.labelCode === fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
      throw new FioError(s.strings.fio_error_invalid_address, fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS)
    }
    if (e.labelCode && e.labelCode === fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_ADDRESS_IS_NOT_EXIST) {
      throw new FioError(s.strings.send_fio_request_error_addr_not_exist, fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_ADDRESS_IS_NOT_EXIST)
    }
    if (e.labelCode && e.labelCode === fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_ADDRESS_IS_NOT_LINKED) {
      throw new FioError(
        sprintf(s.strings.err_address_not_linked_title, tokenCode),
        fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_ADDRESS_IS_NOT_LINKED
      )
    }
    throw new Error(s.strings.fio_connect_wallets_err)
  }
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

export const checkRecordSendFee = async (fioWallet: EdgeCurrencyWallet | null, fioAddress: string) => {
  if (!fioWallet) throw new Error(s.strings.fio_wallet_missing_for_fio_address)
  let getFeeResult
  try {
    getFeeResult = await fioWallet.otherMethods.fioAction('getFee', {
      endPoint: 'record_obt_data',
      fioAddress: fioAddress
    })
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  const bundles = await getRemainingBundles(fioWallet, fioAddress)
  // record_obt_data requires 2 bundled transactions
  if (getFeeResult.fee !== 0 || bundles < 2) {
    throw new FioError(`${s.strings.fio_no_bundled_err_msg} ${s.strings.fio_no_bundled_add_err_msg}`, FIO_NO_BUNDLED_ERR_CODE)
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
      const { obt_data_records: lastRecords } = await fioWallet.otherMethods.fioAction('getObtData', {})
      obtDataRecords = [...obtDataRecords, ...lastRecords]
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

export const checkIsDomainPublic = async (fioPlugin: EdgeCurrencyConfig, domain: string): Promise<void> => {
  let isDomainPublic = false
  try {
    isDomainPublic = fioPlugin.otherMethods ? await fioPlugin.otherMethods.isDomainPublic(domain) : false
  } catch (e) {
    if (e.labelCode && e.labelCode === fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_DOMAIN_IS_NOT_EXIST) {
      throw new Error(s.strings.fio_get_reg_info_domain_err_msg)
    }

    throw new Error(s.strings.fio_connect_wallets_err)
  }

  if (!isDomainPublic) {
    throw new Error(s.strings.fio_address_register_domain_is_not_public)
  }
}

/**
 *
 * @param fioPlugin
 * @param fioAddress
 * @param selectedWallet
 * @param selectedDomain
 * @param displayDenomination
 * @param isFallback
 * @returns {Promise<{activationCost: number, feeValue: number, supportedCurrencies:{[string]: boolean}, paymentInfo: {[string]: {amount: string, address: string}}}>}
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
  feeValue: number,
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } }
}> => {
  let activationCost = 0
  let feeValue = 0

  try {
    feeValue = await selectedWallet.otherMethods.getFee('registerFioAddress')
    activationCost = parseFloat(truncateDecimals(div(`${feeValue}`, displayDenomination.multiplier, DECIMAL_PRECISION)))
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }

  if (selectedDomain.walletId) {
    return {
      activationCost,
      feeValue,
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
  // todo: temporary commented to use fallback referral code by default.
  // const referralCode = isFallback ? fioPlugin.currencyInfo.defaultSettings.fallbackRef : fioPlugin.currencyInfo.defaultSettings.defaultRef
  const reqResult = await buyAddressRequest(fioPlugin, fioAddress, fioPlugin.currencyInfo.defaultSettings.fallbackRef, selectedWallet, activationCost)
  return {
    ...reqResult,
    feeValue
  }
}

/**
 *
 * @param fioPlugin
 * @param fioDomain
 * @param selectedWallet
 * @param displayDenomination
 * @returns {Promise<{activationCost: number, feeValue: number, supportedCurrencies:{[string]: boolean}, paymentInfo: {[string]: {amount: string, address: string}}}>}
 */
export const getDomainRegInfo = async (
  fioPlugin: EdgeCurrencyConfig,
  fioDomain: string,
  selectedWallet: EdgeCurrencyWallet,
  displayDenomination: EdgeDenomination
): Promise<{
  supportedCurrencies: { [currencyCode: string]: boolean },
  activationCost: number,
  feeValue: number,
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } }
}> => {
  let activationCost = 0
  let feeValue = 0

  try {
    feeValue = await selectedWallet.otherMethods.getFee('registerFioDomain')
    activationCost = parseFloat(truncateDecimals(div(`${feeValue}`, displayDenomination.multiplier, DECIMAL_PRECISION)))
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }

  const reqResult = await buyAddressRequest(fioPlugin, fioDomain, fioPlugin.currencyInfo.defaultSettings.defaultRef, selectedWallet, activationCost)
  return {
    ...reqResult,
    feeValue
  }
}

const buyAddressRequest = async (
  fioPlugin: EdgeCurrencyConfig,
  address: string,
  referralCode: string,
  selectedWallet: EdgeCurrencyWallet,
  activationCost: number
): Promise<{
  supportedCurrencies: { [currencyCode: string]: boolean },
  activationCost: number,
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } }
}> => {
  try {
    const buyAddressResponse: BuyAddressResponse = await fioPlugin.otherMethods.buyAddressRequest({
      address,
      referralCode,
      publicKey: selectedWallet.publicWalletInfo.keys.publicKey
    })

    if (buyAddressResponse.success) {
      const supportedCurrencies = { [FIO_STR]: true }
      const paymentInfo = {
        [FIO_STR]: {
          amount: `${activationCost}`,
          nativeAmount: '',
          address: ''
        }
      }

      for (const currencyKey of Object.keys(buyAddressResponse.success.charge.pricing)) {
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
    const errorMessages = {
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS]: s.strings.fio_error_invalid_address,
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_DOMAIN_IS_NOT_EXIST]: s.strings.fio_get_reg_info_domain_err_msg,
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.FIO_DOMAIN_IS_NOT_PUBLIC]: s.strings.fio_address_register_domain_is_not_public,
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.SERVER_ERROR]: s.strings.fio_get_reg_info_err_msg,
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.ALREADY_SENT_REGISTRATION_REQ_FOR_DOMAIN]: s.strings.fio_get_reg_info_already_sent_err_msg,
      [fioPlugin.currencyInfo.defaultSettings.errorCodes.ALREADY_REGISTERED]: s.strings.fio_address_register_screen_not_available
    }
    if (e.labelCode && errorMessages[e.labelCode]) {
      throw new Error(errorMessages[e.labelCode])
    }
  }
  throw new Error(s.strings.fio_get_reg_info_err_msg)
}

export const getRemainingBundles = async (fioWallet: EdgeCurrencyWallet, fioName: string): Promise<number> => {
  let numBundles = Infinity
  try {
    const fioAddresses: FioAddress[] = await fioWallet.otherMethods.getFioAddresses()
    const fioAddress = fioAddresses.find(fioAddress => fioAddress.name === fioName)
    if (fioAddress != null) numBundles = fioAddress.bundledTxs
  } catch (e) {
    // If getFioAddresses fails, it's best to assume a lot of bundles remain so that the user can still attempt to complete whatever action follows
    console.log('getRemainingBundles error - ', e?.message)
  }
  return numBundles
}

export const getAddBundledTxsFee = async (fioWallet: EdgeCurrencyWallet | null): Promise<number> => {
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', {
        endPoint: 'add_bundled_transactions',
        fioAddress: ''
      })

      return fee
    } catch (e) {
      throw new Error(s.strings.fio_get_fee_err_msg)
    }
  }
  throw new Error(s.strings.fio_get_fee_err_msg)
}

export const addBundledTxs = async (fioWallet: EdgeCurrencyWallet | null, fioAddress: string, fee: number): Promise<{ expiration: string }> => {
  if (fioWallet) {
    try {
      const params = { fioAddress, bundleSets: DEFAULT_BUNDLE_SET_VALUE, maxFee: fee }
      return await fioWallet.otherMethods.fioAction('addBundledTransactions', params)
    } catch (e) {
      throw new Error(s.strings.fio_add_bundled_txs_err_msg)
    }
  }
  throw new Error(s.strings.fio_add_bundled_txs_err_msg)
}

export const getRenewalFee = async (fioWallet: EdgeCurrencyWallet | null): Promise<number> => {
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', {
        endPoint: 'renew_fio_domain',
        fioAddress: ''
      })

      return fee
    } catch (e) {
      throw new Error(s.strings.fio_get_fee_err_msg)
    }
  }
  throw new Error(s.strings.fio_get_fee_err_msg)
}

export const renewFioDomain = async (fioWallet: EdgeCurrencyWallet | null, fioDomain: string, fee: number): Promise<{ expiration: string }> => {
  const errorStr = sprintf(s.strings.fio_renew_err_msg, s.strings.fio_domain_label)
  if (fioWallet) {
    try {
      const params = { fioDomain, maxFee: fee }
      const { expiration } = await fioWallet.otherMethods.fioAction('renewFioDomain', params)
      return { expiration }
    } catch (e) {
      throw new Error(errorStr)
    }
  }
  throw new Error(errorStr)
}

export const getDomainSetVisibilityFee = async (fioWallet: EdgeCurrencyWallet | null): Promise<number> => {
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', {
        endPoint: 'set_fio_domain_public',
        fioAddress: ''
      })

      return fee
    } catch (e) {
      throw new Error(s.strings.fio_get_fee_err_msg)
    }
  }
  throw new Error(s.strings.fio_get_fee_err_msg)
}

export const setDomainVisibility = async (
  fioWallet: EdgeCurrencyWallet | null,
  fioDomain: string,
  isPublic: boolean,
  fee: number
): Promise<{ expiration: string }> => {
  if (fioWallet) {
    try {
      const { expiration } = await fioWallet.otherMethods.fioAction('setFioDomainVisibility', { fioDomain, isPublic, maxFee: fee })
      return { expiration }
    } catch (e) {
      throw new Error(s.strings.fio_domain_set_visibility_err)
    }
  }
  throw new Error(s.strings.fio_domain_set_visibility_err)
}

export const getTransferFee = async (fioWallet: EdgeCurrencyWallet | null, forDomain: boolean = false): Promise<number> => {
  if (fioWallet) {
    try {
      const { fee } = await fioWallet.otherMethods.fioAction('getFee', {
        endPoint: forDomain ? 'transfer_fio_domain' : 'transfer_fio_address',
        fioAddress: ''
      })

      return fee
    } catch (e) {
      throw new Error(s.strings.fio_get_fee_err_msg)
    }
  }
  throw new Error(s.strings.fio_get_fee_err_msg)
}

export const cancelFioRequest = async (fioWallet: EdgeCurrencyWallet | null, fioRequestId: number, fioAddress: string) => {
  if (!fioWallet) throw new Error(s.strings.fio_wallet_missing_for_fio_address)
  let getFeeResult
  try {
    getFeeResult = await fioWallet.otherMethods.fioAction('getFeeForCancelFundsRequest', { fioAddress })
  } catch (e) {
    throw new Error(s.strings.fio_get_fee_err_msg)
  }
  if (getFeeResult.fee !== 0) {
    throw new FioError(`${s.strings.fio_no_bundled_err_msg} ${s.strings.fio_no_bundled_add_err_msg}`, FIO_NO_BUNDLED_ERR_CODE)
  }
  try {
    await fioWallet.otherMethods.fioAction('cancelFundsRequest', {
      fioRequestId,
      maxFee: getFeeResult.fee
    })
  } catch (e) {
    throw new Error(s.strings.fio_cancel_request_error)
  }
}

export const expiredSoon = (expDate: string): boolean => {
  return new Date(expDate).getTime() - new Date().getTime() < MONTH
}

export const needToCheckExpired = (lastChecks: { [fioName: string]: Date }, fioName: string): boolean => {
  try {
    let lastCheck = lastChecks[fioName]
    if (!lastCheck) {
      lastCheck = new Date()
      lastCheck.setMonth(new Date().getMonth() - 1)
    }
    const now = new Date()
    return now.getMonth() !== lastCheck.getMonth() || now.getFullYear() !== lastCheck.getFullYear()
  } catch (e) {
    //
  }
  return false
}

export const getExpiredSoonFioDomains = (fioDomains: FioDomain[]): FioDomain[] => {
  const expiredFioDomains: FioDomain[] = []
  for (const fioDomain of fioDomains) {
    if (expiredSoon(fioDomain.expiration)) {
      expiredFioDomains.push(fioDomain)
    }
  }

  return expiredFioDomains
}

export const refreshFioNames = async (
  fioWallets: EdgeCurrencyWallet[]
): Promise<{ fioAddresses: FioAddress[], fioDomains: FioDomain[], fioWalletsById: { string: EdgeCurrencyWallet } }> => {
  const fioWalletsById: { [string]: EdgeCurrencyWallet } = {}
  let fioAddresses: FioAddress[] = []
  let fioDomains: FioDomain[] = []

  if (fioWallets != null) {
    for (const wallet of fioWallets) {
      const walletId = wallet.id
      const walletFioAddresses = await wallet.otherMethods.getFioAddresses()
      fioAddresses = [...fioAddresses, ...walletFioAddresses.map(({ name, bundledTxs }) => ({ name, bundledTxs, walletId }))]
      const walletFioDomains = await wallet.otherMethods.getFioDomains()
      fioDomains = [...fioDomains, ...walletFioDomains.map(({ name, expiration, isPublic }) => ({ name, expiration, isPublic, walletId }))]
      fioWalletsById[walletId] = wallet
    }
  }

  return { fioAddresses, fioDomains, fioWalletsById }
}
