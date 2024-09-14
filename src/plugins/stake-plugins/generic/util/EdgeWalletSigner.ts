import { defineReadOnly } from '@ethersproject/properties'
import { EdgeCurrencyWallet, EdgeMemo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'
import { base16 } from 'rfc4648'

// import { EdgeWalletProvider } from './EdgeWalletProvider'

export class EdgeWalletSigner extends ethers.Signer {
  wallet: EdgeCurrencyWallet
  _lastSignedEdgeTransaction?: EdgeTransaction

  constructor(wallet: EdgeCurrencyWallet, provider?: ethers.providers.Provider) {
    super()

    this.wallet = wallet

    // TODO: Get EdgeWalletProvider to work so we can leverage the wallets network
    // const provider = new EdgeWalletProvider(wallet)
    if (provider && !ethers.providers.Provider.isProvider(provider)) {
      ethers.logger.throwArgumentError('invalid provider', 'provider', provider)
    }

    defineReadOnly(this, 'provider', provider)
  }

  async getAddress(): Promise<string> {
    const { publicAddress } = await this.wallet.getReceiveAddress({ tokenId: null })
    return publicAddress
  }

  async signMessage(message: string | ethers.utils.Bytes): Promise<string> {
    const messageNormalized = typeof message === 'string' ? message : base16.stringify(message)
    return await this.wallet.signMessage(messageNormalized)
  }

  async signTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<string> {
    const edgeTransaction = await this.ethersTransactionToEdgeTransaction(transaction)
    const signedEdgeTransaction = await this.wallet.signTx(edgeTransaction)
    this._lastSignedEdgeTransaction = signedEdgeTransaction
    return signedEdgeTransaction.signedTx
  }

  async sendTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<ethers.providers.TransactionResponse> {
    if (this.provider == null) throw new Error('missing provider for EdgeWalletSigner')
    this._checkProvider('sendTransaction')

    const tx = await this.populateTransaction(transaction)
    const signedTx = await this.signTransaction(tx)

    if (this._lastSignedEdgeTransaction == null) {
      throw new Error('Missing _lastSignedEdgeTransaction after invoking signTransaction')
    }
    await this.wallet.saveTx(this._lastSignedEdgeTransaction)

    return await this.provider.sendTransaction(signedTx)
  }

  protected async ethersTransactionToEdgeTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<EdgeTransaction> {
    const spendTargets: EdgeSpendTarget[] = [
      {
        nativeAmount: (await transaction.value)?.toString(),
        publicAddress: await transaction.to
      }
    ]
    const gasLimit = BigNumber.from((await transaction.gasLimit) ?? 0)

    let gasPrice: BigNumber
    const txGasPrice = BigNumber.from((await transaction.gasPrice) ?? 0)
    if (txGasPrice.eq(0)) {
      const maxFeePerGas = BigNumber.from((await transaction.maxFeePerGas) ?? 0)
      gasPrice = maxFeePerGas
    } else {
      gasPrice = txGasPrice
    }

    const data = await transaction.data

    const memoHexValue = data == null ? undefined : typeof data === 'string' ? data.replace('0x', '') : base16.stringify(data)
    const memos: EdgeMemo[] = memoHexValue == null ? [] : [{ type: 'hex', value: memoHexValue }]

    const customData = await transaction.customData

    const edgeTransaction = await this.wallet.makeSpend({
      tokenId: null,
      spendTargets,
      memos,
      metadata: customData?.metadata,
      networkFeeOption: 'custom',
      customNetworkFee: {
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei').toString(),
        gasLimit: gasLimit.toString()
      }
    })
    return edgeTransaction
  }

  connect(provider: ethers.providers.Provider): EdgeWalletSigner {
    return new EdgeWalletSigner(this.wallet, provider)
  }
}
