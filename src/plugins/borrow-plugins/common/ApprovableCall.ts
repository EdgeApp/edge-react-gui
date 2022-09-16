import { asObject, asOptional, asString } from 'cleaners'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeSpendInfo, EdgeToken, EdgeTransaction } from 'edge-core-js'
import { ethers } from 'ethers'

import { ApprovableAction } from '../types'
import { asBigNumber } from './cleaners/asBigNumber'

export const asTxInfo = asObject({
  data: asString,
  to: asString,
  value: asOptional(asBigNumber),
  gasPrice: asOptional(asBigNumber),
  gasLimit: asOptional(asBigNumber)
})
export type TxInfo = ReturnType<typeof asTxInfo>

export type CallInfo = {
  tx: TxInfo
  wallet: EdgeCurrencyWallet
  spendToken?: EdgeToken
  metadata?: EdgeMetadata
  pendingTxs: EdgeTransaction[]
}

export const makeApprovableCall = async (params: CallInfo): Promise<ApprovableAction> => {
  const { tx: txInfo, wallet, spendToken, metadata, pendingTxs } = params
  const { id: walletId } = wallet
  const { gasLimit, gasPrice } = txInfo

  if (gasPrice == null || gasLimit == null) throw new Error('Explicit gas price and limit required for ApprovableAction.')

  const makeSpend = async (dryrun: boolean): Promise<EdgeTransaction> => {
    const edgeSpendInfo: EdgeSpendInfo = {
      // @ts-expect-error
      pluginId: wallet.currencyInfo.pluginId,
      currencyCode: spendToken?.currencyCode ?? wallet.currencyInfo.currencyCode,
      skipChecks: dryrun,
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
      metadata,
      pendingTxs
    }

    const edgeUnsignedTx: EdgeTransaction = await wallet.makeSpend(edgeSpendInfo)
    return edgeUnsignedTx
  }

  const dryrunUnsignedTx = await makeSpend(true)
  const networkFee = {
    currencyCode: wallet.currencyInfo.currencyCode,
    nativeAmount: dryrunUnsignedTx.parentNetworkFee ?? dryrunUnsignedTx.networkFee ?? '0'
  }

  return {
    networkFee,
    unsignedTxs: [dryrunUnsignedTx],
    dryrun: async () => {
      const tx = await wallet.signTx(dryrunUnsignedTx)
      return [{ walletId, networkFee, tx }]
    },
    approve: async () => {
      const edgeUnsignedTx = await makeSpend(false)
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
