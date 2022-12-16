import { asObject, asOptional, asString } from 'cleaners'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeSpendInfo, EdgeToken, EdgeTransaction } from 'edge-core-js'
import { ethers } from 'ethers'

import { PendingTxMap } from '../../../controllers/action-queue/types'
import { ApprovableAction } from '../types'
import { asBigNumber } from './cleaners/asBigNumber'
import { SIDE_EFFECT_CURRENCY_CODE } from './constants'

export const asTxInfo = asObject({
  data: asString,
  to: asString,
  value: asOptional(asBigNumber),
  gasPrice: asOptional(asBigNumber),
  gasLimit: asOptional(asBigNumber)
})
export type TxInfo = ReturnType<typeof asTxInfo>

export interface CallInfo {
  tx: TxInfo
  wallet: EdgeCurrencyWallet
  spendToken?: EdgeToken
  nativeAmount?: string
  metadata?: EdgeMetadata
}

export const makeApprovableCall = async (params: CallInfo): Promise<ApprovableAction> => {
  const { tx: txInfo, wallet, spendToken, nativeAmount, metadata } = params
  const { id: walletId } = wallet
  const { gasLimit, gasPrice } = txInfo

  if (gasPrice == null || gasLimit == null) throw new Error('Explicit gas price and limit required for ApprovableAction.')

  const makeApprovableCallSpend = async (dryrun: boolean, pendingTxMap: Readonly<PendingTxMap>): Promise<EdgeTransaction> => {
    const pendingTxs = pendingTxMap[walletId]
    const edgeSpendInfo: EdgeSpendInfo = {
      currencyCode: spendToken?.currencyCode ?? wallet.currencyInfo.currencyCode,
      skipChecks: dryrun,
      spendTargets: [
        {
          nativeAmount: txInfo.value ? txInfo.value.toString() : nativeAmount ?? '0',
          publicAddress: txInfo.to,
          otherParams: { data: txInfo.data }
        }
      ],
      customNetworkFee: {
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei').toString(),
        gasLimit: gasLimit.toString()
      },
      networkFeeOption: 'custom',
      metadata,
      pendingTxs
    }

    const edgeUnsignedTx: EdgeTransaction = await wallet.makeSpend(edgeSpendInfo)
    return edgeUnsignedTx
  }

  const placeholderTx = await makeApprovableCallSpend(true, {})
  const networkFee = {
    currencyCode: wallet.currencyInfo.currencyCode,
    nativeAmount: placeholderTx.parentNetworkFee ?? placeholderTx.networkFee ?? '0'
  }

  return {
    networkFee,
    unsignedTxs: [placeholderTx],
    dryrun: async pendingTxMap => {
      const unsignedTx = await makeApprovableCallSpend(true, pendingTxMap)
      const tx = await wallet.signTx(unsignedTx)
      const networkFee = {
        currencyCode: wallet.currencyInfo.currencyCode,
        nativeAmount: tx.parentNetworkFee ?? tx.networkFee ?? '0'
      }
      return [{ walletId, networkFee, tx }]
    },
    approve: async () => {
      const edgeUnsignedTx = await makeApprovableCallSpend(false, {})
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

export const makeSideEffectApprovableAction = (approve: () => Promise<void>): ApprovableAction => {
  return {
    unsignedTxs: [],
    networkFee: {
      currencyCode: SIDE_EFFECT_CURRENCY_CODE,
      nativeAmount: ''
    },
    dryrun: async () => [],
    async approve() {
      await approve()
      return []
    }
  }
}
