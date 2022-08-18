// @flow

import { asObject, asOptional, asString } from 'cleaners'
import { type EdgeCurrencyWallet, type EdgeMetadata, type EdgeSpendInfo, type EdgeToken, type EdgeTransaction } from 'edge-core-js'
import { ethers } from 'ethers'

import { type ApprovableAction } from '../types'
import { asBigNumber } from './cleaners/asBigNumber'

export const asTxInfo = asObject({
  data: asString,
  to: asString,
  value: asOptional(asBigNumber),
  gasPrice: asOptional(asBigNumber),
  gasLimit: asOptional(asBigNumber)
})
export type TxInfo = $Call<typeof asTxInfo>

export type CallInfo = {
  tx: TxInfo,
  wallet: EdgeCurrencyWallet,
  spendToken?: EdgeToken,
  metadata?: EdgeMetadata
}

export const makeApprovableCall = async (params: CallInfo): Promise<ApprovableAction> => {
  const { tx: txInfo, wallet, spendToken, metadata } = params
  const { id: walletId } = wallet
  const { gasLimit, gasPrice } = txInfo

  if (gasPrice == null || gasLimit == null) throw new Error('Explicit gas price and limit required for ApprovableAction.')

  const edgeSpendInfo: EdgeSpendInfo = {
    pluginId: wallet.currencyInfo.pluginId,
    currencyCode: spendToken?.currencyCode ?? wallet.currencyInfo.currencyCode,
    spendTargets: [
      {
        nativeAmount: txInfo.value ? txInfo.value.toString() : '0',
        publicAddress: txInfo.to,
        otherParams: { data: txInfo.data }
      }
    ],
    customNetworkFee: {
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei').toString(),
      gasLimit: gasLimit.toString()
    },
    networkFeeOption: 'custom',
    metadata
  }
  const edgeUnsignedTx: EdgeTransaction = await wallet.makeSpend(edgeSpendInfo)

  const networkFee = {
    currencyCode: wallet.currencyInfo.currencyCode,
    nativeAmount: edgeUnsignedTx.parentNetworkFee ?? edgeUnsignedTx.networkFee ?? '0'
  }

  return {
    networkFee,
    unsignedTxs: [edgeUnsignedTx],
    dryrun: async () => {
      const tx = await wallet.signTx(edgeUnsignedTx)
      return [{ walletId, networkFee, tx }]
    },
    approve: async () => {
      const tx = await wallet.signTx(edgeUnsignedTx)
      await wallet.broadcastTx(tx)
      await wallet.saveTx(tx)
      return [{ walletId, networkFee, tx }]
    }
  }
}

export const makeTxCalls = async (actionInfos: CallInfo[]): Promise<ApprovableAction[]> => {
  return await Promise.all(actionInfos.map(makeApprovableCall))
}
