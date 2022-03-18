// @flow
import '@ethersproject/shims'

import { add, gte, lte, mul, sub } from 'biggystring'
import type { EdgeCorePluginOptions } from 'edge-core-js'
import { ethers } from 'ethers'

import { jsonRpcProvider, makeContract } from './contracts.js'
import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import { makeTxBuilder } from './TxBuilder.js'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakeDetailRequest, StakeDetails, StakePlugin, StakePolicy } from './types.js'
import { fromHex, toHex } from './util/hex.js'

export * from './types.js'

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  // Get the pool contract necessary for the staking
  // TODO: Replace the hardcode with a configuration from initOptions
  const poolContract = makeContract('TOMB_MASONRY')

  const instance: StakePlugin = {
    async getStakePolicies(): Promise<StakePolicy[]> {
      // TODO: Calculate APY form reading the blockchain
      const policies = pluginInfo.policyInfo.map(toStakePolicy)
      return policies
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Get the signer for the wallet
      const signer = new ethers.Wallet(wallet.displayPrivateSeed, jsonRpcProvider)

      // TODO: Replace this assertion with an LP-contract call to get the liquidity pool ratios
      if (policyInfo.stakeAssets.length > 1) throw new Error(`Multi-asset staking is not supported`)

      //
      // Calculate the allocations (stake/unstake/claim) amounts
      //

      const allocations: QuoteAllocation[] = []

      // Calculate the stake asset native amounts:
      if (action === 'stake' || action === 'unstake') {
        allocations.push(
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ tokenId }) => {
            // TODO: Replace this assertion with an algorithm to calculate each asset amount using the LP-pool ratio
            if (tokenId !== request.tokenId) throw new Error(`Token '${tokenId}' to ${action} not found in policy`)

            return {
              allocationType: action,
              tokenId,
              nativeAmount: request.nativeAmount
            }
          })
        )
      }
      // Calculate the claim asset native amounts:
      if (action === 'claim') {
        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ tokenId }) => {
            // TODO: Replace this assertion with an algorithm to calculate each asset amount using the LP-pool ratio
            if (tokenId !== request.tokenId) throw new Error(`Token '${tokenId}' to ${action} not found in policy`)

            return {
              allocationType: 'claim',
              tokenId,
              nativeAmount: request.nativeAmount
            }
          })
        )
      }

      //
      // Checks balances and action permissibility
      //

      // Assert if the action is allowed
      const checkTxResponse = await (async () => {
        switch (action) {
          case 'unstake':
            return await poolContract.canWithdraw(signer.getAddress())
          case 'claim':
            return await poolContract.canClaimReward(signer.getAddress())
          default:
            return true
        }
      })()
      if (!checkTxResponse) throw new Error(`Cannot ${action} for token '${request.tokenId}'`)

      // TODO: Change this algorithm to check the balance of every token in the stakeAllocations array when multiple assets are supported
      await Promise.all(
        allocations.map(async allocation => {
          // Assert if enough token balance is available
          const balanceResponse = await (async () => {
            switch (allocation.allocationType) {
              case 'stake': {
                const tokenContract = makeContract(allocation.tokenId)
                return await tokenContract.balanceOf(signer.getAddress())
              }
              case 'unstake':
                return await poolContract.balanceOf(signer.getAddress())
              case 'claim':
                return await poolContract.earned(signer.getAddress())
              case 'fee':
                // Don't do anything with fee
                break
              default:
                throw new Error('Unkown allocation type')
            }
          })()
          if (balanceResponse == null) return
          const balanceAmount = fromHex(balanceResponse._hex)
          const isBalanceEnough = lte(allocation.nativeAmount, balanceAmount)
          if (!isBalanceEnough) {
            throw new Error(`Cannot withdraw '${allocation.nativeAmount}' with '${allocation.tokenId}' token balance ${balanceAmount}`)
          }
        })
      )

      //
      // Build transaction workflow
      //

      // An array of all the transactions to dispatch upon approval
      const txBuilder = makeTxBuilder()

      // Supply token-pair to Liquidity-Pool-Contract Workflow:
      // 1. Send Approve TX on Liquidity-Pool-Contract
      // 2. Send supply TX on Liquidity-Pool-Contract
      // 3. Use the LP-token as the Stake-Token
      // TODO: Implement this workflow for multiple assets

      // Stake the Stake-Token Workflow:
      // 1. Send approve() TX on Stake-Token-Contract if allowance is not MaxUint256
      // 2. Send Stake TX on Pool-Contract

      // Make sure the allowance >= nativeAmount for the selected allocation
      // TODO: Change condition to check the `allowance >= nativeAmount` for each stake-asset
      await Promise.all(
        allocations.map(async allocation => {
          // We don't need to approve the stake pool contract for the token earned token contract
          if (allocation.allocationType === 'claim') return
          const tokenContract = makeContract(allocation.tokenId)
          const allowanceResponse = await tokenContract.allowance(signer.getAddress(), poolContract.address)
          const isFullyAllowed = gte(sub(allowanceResponse._hex, toHex(allocation.nativeAmount)), '0')
          if (!isFullyAllowed) {
            txBuilder.addCall(tokenContract, 'approve', [signer.getAddress(), ethers.constants.MaxUint256])
          }
        })
      )

      // Action transaction (Stake/Unstake/Claim)
      if (action === 'stake') {
        txBuilder.addCall(poolContract, 'stake', [
          toHex(request.nativeAmount),
          {
            gasLimit: { _hex: toHex('120794'), _isBigNumber: true }
          }
        ])
      }
      if (action === 'unstake') {
        txBuilder.addCall(poolContract, 'withdraw', [
          toHex(request.nativeAmount),
          {
            gasLimit: { _hex: toHex('120794'), _isBigNumber: true }
          }
        ])
      }

      if (action === 'claim') {
        // Claiming withdraws all earned tokens, so we ignore the nativeAmount from the request
        txBuilder.addCall(poolContract, 'claimReward', [
          {
            gasLimit: { _hex: toHex('120794'), _isBigNumber: true }
          }
        ])
      }

      //
      // Calculate the fees
      //

      // Calculate the fees:
      // 1. Get the gasPrice oracle data (from wallet)
      // 2. Calculate the sum(tx => gasLimit(txType) * gasPrice) as the networkFee in native token
      const gasPrice = (await jsonRpcProvider.getGasPrice())._hex
      const gasEstimates = await Promise.all(txBuilder.getCalls().map(({ estimateGas }) => estimateGas()))
      const networkFee = gasEstimates.reduce((sum, gasEstimate) => {
        return add(sum, mul(gasPrice, gasEstimate._hex, 10))
      }, '0')
      allocations.push({
        allocationType: 'fee',
        tokenId: policyInfo.parentTokenId,
        nativeAmount: networkFee
      })

      //
      // Return the quote
      //

      // Construct an approve function which executes transaction workflow (txBuilder)
      const approve: () => Promise<void> = async () => {
        for (const { contract, method, args } of txBuilder.getCalls()) {
          await contract.connect(signer)[method](...args)
          // NOTE: Don't wait for block confirmation because that's too slow
        }
      }

      return {
        allocations,
        approve
      }
    },
    async fetchStakeDetails(request: StakeDetailRequest): Promise<StakeDetails> {
      return {
        allocations: []
      }
    }
  }
  return instance
}
