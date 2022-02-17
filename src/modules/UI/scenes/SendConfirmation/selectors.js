// @flow

import { gte } from 'biggystring'
import type { EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'

import { getExchangeDenomination } from '../../../../selectors/DenominationSelectors.js'
import { convertCurrency } from '../../../../selectors/WalletSelectors.js'
import { type RootState } from '../../../../types/reduxTypes.js'
import { type GuiMakeSpendInfo, type SpendAuthType } from '../../../../types/types.js'
import { convertNativeToExchange, DECIMAL_PRECISION } from '../../../../util/utils.js'

export const initialState = {
  forceUpdateGuiCounter: 0,

  guiMakeSpendInfo: {
    networkFeeOption: 'standard',
    customNetworkFee: {},
    publicAddress: '',
    nativeAmount: '',
    metadata: {
      name: '',
      category: '',
      notes: '',
      amountFiat: 0,
      bizId: 0
    }
  },
  spendInfo: null,
  transactionMetadata: null,
  nativeAmount: '',

  isEditable: true,

  transaction: {
    txid: '',
    date: 0,
    currencyCode: '',
    blockHeight: -1,
    nativeAmount: '',
    networkFee: '',
    parentNetworkFee: '',
    ourReceiveAddresses: [],
    signedTx: '',
    metadata: {},
    otherParams: {}
  },
  pending: false,
  error: null,

  pin: '',
  authRequired: 'none',
  address: '',

  toggleCryptoOnTop: 0,

  maxSpendSet: false,

  isSendUsingFioAddress: false
}

export const getTransaction = (state: RootState): EdgeTransaction => state.ui.scenes.sendConfirmation.transaction || initialState.transaction
export const getGuiMakeSpendInfo = (state: RootState): GuiMakeSpendInfo => state.ui.scenes.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo

const getNetworkFeeOption = (state: RootState): 'high' | 'standard' | 'low' | 'custom' =>
  getGuiMakeSpendInfo(state).networkFeeOption || initialState.guiMakeSpendInfo.networkFeeOption

const getCustomNetworkFee = (state: RootState): any => getGuiMakeSpendInfo(state).customNetworkFee || initialState.guiMakeSpendInfo.customNetworkFee || {}
const getMetadata = (state: RootState): EdgeMetadata => getGuiMakeSpendInfo(state).metadata || initialState.guiMakeSpendInfo.metadata || {}
export const getPublicAddress = (state: RootState): string => {
  try {
    return (
      getGuiMakeSpendInfo(state).publicAddress ||
      initialState.guiMakeSpendInfo.publicAddress ||
      // $FlowFixMe
      state.ui.scenes.sendConfirmation.spendInfo.spendTargets[0].publicAddress ||
      ''
    )
  } catch (e) {
    return ''
  }
}
const getNativeAmount = (state: RootState): string | void => state.ui.scenes.sendConfirmation.nativeAmount

const getUniqueIdentifier = (state: RootState): string => {
  const guiMakeSpendInfo = state.ui.scenes.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo
  const uniqueIdentifier = guiMakeSpendInfo.uniqueIdentifier || ''
  return uniqueIdentifier || ''
}
const getSpendTargetOtherParams = (state: RootState): Object => {
  try {
    const { spendInfo } = state.ui.scenes.sendConfirmation
    if (spendInfo == null) return {}
    return spendInfo.spendTargets[0].otherParams || {}
  } catch (e) {
    return {}
  }
}

export const getSpendInfo = (state: RootState, newSpendInfo?: GuiMakeSpendInfo = {}, selectedCurrencyCode?: string): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier != null ? newSpendInfo.uniqueIdentifier : getUniqueIdentifier(state)
  let spendTargets = []
  if (newSpendInfo.spendTargets) {
    spendTargets = newSpendInfo.spendTargets
  } else {
    spendTargets = [
      {
        nativeAmount: newSpendInfo.nativeAmount || getNativeAmount(state),
        publicAddress: newSpendInfo.publicAddress || getPublicAddress(state),
        otherParams: {
          ...getSpendTargetOtherParams(state),
          uniqueIdentifier
        }
      }
    ]
  }

  return {
    currencyCode: newSpendInfo.currencyCode || selectedCurrencyCode,
    metadata: newSpendInfo.metadata ? { ...getMetadata(state), ...newSpendInfo.metadata } : getMetadata(state),
    spendTargets,
    networkFeeOption: newSpendInfo.networkFeeOption || getNetworkFeeOption(state),
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...getCustomNetworkFee(state), ...newSpendInfo.customNetworkFee } : getCustomNetworkFee(state),
    otherParams: newSpendInfo.otherParams || {}
  }
}

export const getSpendInfoWithoutState = (newSpendInfo?: GuiMakeSpendInfo = {}, sceneState: Object, selectedCurrencyCode: string): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier || sceneState.guiMakeSpendInfo.uniqueIdentifier || ''
  let spendTargets = []
  if (newSpendInfo.spendTargets) {
    spendTargets = newSpendInfo.spendTargets
  } else {
    spendTargets = [
      {
        nativeAmount: newSpendInfo.nativeAmount || sceneState.nativeAmount,
        publicAddress: newSpendInfo.publicAddress || initialState.guiMakeSpendInfo.publicAddress || sceneState.spendInfo.spendTargets[0].publicAddress,
        otherParams: {
          uniqueIdentifier,
          ...sceneState.spendInfo.spendTargets[0].otherParams
        }
      }
    ]
  }
  const metaData = sceneState.guiMakeSpendInfo.metadata || initialState.guiMakeSpendInfo.metadata
  const customNetworkFee = sceneState.guiMakeSpendInfo.customNetworkFee || initialState.guiMakeSpendInfo.customNetworkFee
  return {
    currencyCode: newSpendInfo.currencyCode || selectedCurrencyCode,
    metadata: newSpendInfo.metadata ? { ...metaData, ...newSpendInfo.metadata } : metaData,
    spendTargets,
    networkFeeOption: newSpendInfo.networkFeeOption || sceneState.guiMakeSpendInfo.networkFeeOption || initialState.guiMakeSpendInfo.networkFeeOption,
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...customNetworkFee, ...newSpendInfo.customNetworkFee } : customNetworkFee,
    otherParams: newSpendInfo.otherParams || {}
  }
}

export const getAuthRequired = (state: RootState, spendInfo: EdgeSpendInfo, walletId: string): SpendAuthType => {
  const isEnabled = state.ui.settings.spendingLimits.transaction.isEnabled
  if (!isEnabled) return 'none'

  const currencyCode = spendInfo.currencyCode
  const { nativeAmount } = spendInfo.spendTargets[0]
  if (nativeAmount === '') return 'none' // TODO: Future change will make this null instead of ''
  if (!currencyCode || !nativeAmount) throw new Error('Invalid Spend Request')

  const { spendingLimits } = state.ui.settings
  const isoFiatCurrencyCode = state.ui.settings.defaultIsoFiat
  const wallet = state.core.account.currencyWallets[walletId]
  const nativeToExchangeRatio = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode).multiplier
  const exchangeAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
  const fiatAmount = convertCurrency(state, currencyCode, isoFiatCurrencyCode, exchangeAmount)
  const exceedsLimit = gte(fiatAmount, spendingLimits.transaction.amount.toFixed(DECIMAL_PRECISION))

  return exceedsLimit ? 'pin' : 'none'
}

export const getAmountRequired = (guiMakeSpendInfo: EdgeSpendInfo): boolean => {
  return guiMakeSpendInfo.otherParams == null || guiMakeSpendInfo.otherParams.action == null || guiMakeSpendInfo.otherParams.action.name == null
}
