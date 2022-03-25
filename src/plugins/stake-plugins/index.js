// @flow
import '@ethersproject/shims'

import { add, gte, lte, mul, sub } from 'biggystring'
import type { EdgeCorePluginOptions } from 'edge-core-js'
import { ethers } from 'ethers'

import { makeContract, makeSigner, multipass } from './contracts.js'
import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import { makeTxBuilder } from './TxBuilder.js'
import { type DetailAllocation } from './types'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakeDetailRequest, StakeDetails, StakePlugin, StakePolicy } from './types.js'
import { getSeed } from './util/getSeed.js'
import { fromHex, toHex } from './util/hex.js'

export * from './types.js'

const HOUR = 1000 * 60 * 60

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  // Get the pool contract necessary for the staking
  // TODO: Replace the hardcode with a configuration from initOptions
  const poolContract = makeContract('TOMB_MASONRY')
  const treasuryContract = makeContract('TOMB_TREASURY')

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to claim
   * their reward from the masonry or void if there is no wait time.
   * @param {string} accountAddress - The address of the account
   * @returns Promise<Date | void>
   */
  async function getUserClaimRewardTime(accountAddress: string): Promise<Date | void> {
    const nextEpochTimestamp = await multipass(p => poolContract.connect(p).nextEpochPoint()) // in unix timestamp
    const currentEpoch = await multipass(p => poolContract.connect(p).epoch())
    const mason = await multipass(p => poolContract.connect(p).masons(accountAddress))
    const startTimeEpoch = mason.epochTimerStart
    const period = await multipass(p => treasuryContract.connect(p).PERIOD())
    const periodInHours = period / 60 / 60 // 6 hours, period is displayed in seconds which is 21600
    const rewardLockupEpochs = await multipass(p => poolContract.connect(p).rewardLockupEpochs())
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(rewardLockupEpochs)

    if (targetEpochForClaimUnlock - currentEpoch <= 0) return

    const nextEpochDate = new Date(nextEpochTimestamp * 1000)

    if (targetEpochForClaimUnlock - currentEpoch === 1) {
      return nextEpochDate
    } else {
      const delta = targetEpochForClaimUnlock - currentEpoch - 1
      const endDate = new Date(nextEpochDate.getTime() + delta * periodInHours * HOUR)
      return endDate
    }
  }

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to unstake
   * from the masonry or void if there is no wait time.
   * @param {string} accountAddress - The address of the account
   * @returns Promise<Date | void>
   */
  async function getUserUnstakeTime(accountAddress: string): Promise<Date | void> {
    const nextEpochTimestamp = await multipass(p => poolContract.connect(p).nextEpochPoint())
    const currentEpoch = await multipass(p => poolContract.connect(p).epoch())
    const mason = await multipass(p => poolContract.connect(p).masons(accountAddress))
    const startTimeEpoch = mason.epochTimerStart
    const period = await multipass(p => treasuryContract.connect(p).PERIOD())
    const periodInHours = period / 60 / 60
    const withdrawLockupEpochs = await multipass(p => poolContract.connect(p).withdrawLockupEpochs())
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(withdrawLockupEpochs)

    if (targetEpochForClaimUnlock - currentEpoch <= 0) return

    const nextEpochDate = new Date(nextEpochTimestamp * 1000)

    if (targetEpochForClaimUnlock - currentEpoch === 1) {
      return nextEpochDate
    } else {
      const delta = targetEpochForClaimUnlock - currentEpoch - 1
      const endDate = new Date(nextEpochDate.getTime() + delta * periodInHours * HOUR)
      return endDate
    }
  }

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

      const signerSeed = getSeed(wallet)

      // Get the signer for the wallet
      const signerAddress = makeSigner(signerSeed).getAddress()

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
            return await multipass(p => poolContract.connect(p).canWithdraw(signerAddress))
          case 'claim':
            return await multipass(p => poolContract.connect(p).canClaimReward(signerAddress))
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
                return await multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
              }
              case 'unstake':
                return await multipass(p => poolContract.connect(p).balanceOf(signerAddress))
              case 'claim':
                return await multipass(p => poolContract.connect(p).earned(signerAddress))
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
          const allowanceResponse = await multipass(p => tokenContract.connect(p).allowance(signerAddress, poolContract.address))
          const isFullyAllowed = gte(sub(allowanceResponse._hex, toHex(allocation.nativeAmount)), '0')
          if (!isFullyAllowed) {
            txBuilder.addCall(tokenContract, 'approve', [signerAddress, ethers.constants.MaxUint256])
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
      const gasPrice = (await multipass(provider => provider.getGasPrice()))._hex
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
          await multipass(p => contract.connect(makeSigner(signerSeed, p))[method](...args))
          // NOTE: Don't wait for block confirmation because that's too slow
        }
      }

      return {
        allocations,
        approve
      }
    },
    // TODO: Implement support for multi-asset staking
    async fetchStakeDetails(request: StakeDetailRequest): Promise<StakeDetails> {
      const { stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Get the signer for the wallet
      const signerAddress = makeSigner(getSeed(wallet)).getAddress()

      // Get staked allocations
      const balanceOfTxResponse = await multipass(p => poolContract.connect(p).balanceOf(signerAddress))
      const stakedAllocations: DetailAllocation[] = [
        {
          tokenId: policyInfo.stakeAssets[0].tokenId,
          allocationType: 'staked',
          nativeAmount: fromHex(balanceOfTxResponse._hex),
          locktime: await getUserUnstakeTime(signerAddress)
        }
      ]

      // Get earned allocations
      const earnedTxRresponse = await multipass(p => poolContract.connect(p).earned(signerAddress))
      const earnedAllocations: DetailAllocation[] = [
        {
          tokenId: policyInfo.rewardAssets[0].tokenId,
          allocationType: 'earned',
          nativeAmount: fromHex(earnedTxRresponse._hex),
          locktime: await getUserClaimRewardTime(signerAddress)
        }
      ]

      return {
        allocations: [...stakedAllocations, ...earnedAllocations]
      }
    }
  }
  return instance
}
