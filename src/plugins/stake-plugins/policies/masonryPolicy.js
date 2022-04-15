// @flow
import { gt, gte, lte, sub } from 'biggystring'
import { ethers } from 'ethers'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { makeContract, makeSigner, multipass } from '../contracts.js'
import { cacheTxMetadata } from '../metadataCache'
import { pluginInfo } from '../pluginInfo.js'
import { type PositionAllocation } from '../types'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakePosition, StakePositionRequest } from '../types.js'
import { makeBigAccumulator } from '../util/accumulator.js'
import { makeBuilder } from '../util/builder.js'
import { getSeed } from '../util/getSeed.js'
import { fromHex, toHex } from '../util/hex.js'
import { type StakePluginPolicy } from './types'

const HOUR = 1000 * 60 * 60

export const makeMasonryPolicy = (): StakePluginPolicy => {
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

  const instance: StakePluginPolicy = {
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Metadata constants:
      const metadataName = 'Tomb Finance'
      const nativeCurrencyCode = policyInfo.parentTokenId
      const metadataStakeCurrencyCode = policyInfo.stakeAssets.map(asset => asset.tokenId)[0]
      const metadataRewardCurrencyCode = policyInfo.rewardAssets.map(asset => asset.tokenId)[0]

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
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ tokenId, pluginId }) => {
            // TODO: Replace this assertion with an algorithm to calculate each asset amount using the LP-pool ratio
            if (tokenId !== request.tokenId) throw new Error(`Requested token '${request.tokenId}' to ${action} not found in policy`)

            return {
              allocationType: action,
              pluginId,
              tokenId,
              nativeAmount: request.nativeAmount
            }
          })
        )
      }
      // Calculate the claim asset native amounts:
      if (action === 'claim' || action === 'unstake') {
        const earnedAmount = (await multipass(p => poolContract.connect(p).earned(signerAddress))).toString()

        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ tokenId, pluginId }) => {
            return {
              allocationType: 'claim',
              pluginId,
              tokenId,
              nativeAmount: earnedAmount
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
            throw new Error(sprintf(s.strings.stake_error_insufficient_s, request.tokenId))
          }
        })
      )

      //
      // Build transaction workflow
      //

      // Signer
      const signer = makeSigner(signerSeed)

      // Accumulators
      const gasLimitAcc = makeBigAccumulator('0')
      let txCount: number = await signer.getTransactionCount()
      const nextNonce = (): number => txCount++

      // Transaction builder
      const txs = makeBuilder(async fn => await multipass(provider => fn({ signer: signer.connect(provider) })))

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
            txs.build(
              (gasLimit =>
                async function approvePoolContract({ signer }) {
                  const result = await tokenContract.connect(signer).approve(poolContract.address, ethers.constants.MaxUint256, {
                    nonce: nextNonce(),
                    gasLimit
                  })
                  cacheTxMetadata(result.hash, nativeCurrencyCode, {
                    name: metadataName,
                    category: 'Expense:Fees',
                    notes: 'Approve staking rewards pool contract'
                  })
                })(gasLimitAcc('50000'))
            )
          }
        })
      )

      // Action transaction (Stake/Unstake/Claim)
      if (action === 'stake') {
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).stake(request.nativeAmount, {
                nonce: nextNonce(),
                gasLimit
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Stake funds'
              })
              cacheTxMetadata(
                result.hash,
                metadataStakeCurrencyCode,
                { name: metadataName, category: 'Transfer:Staking', notes: 'Stake funds' },
                request.nativeAmount
              )
            })(gasLimitAcc('240000'))
        )
      }

      const earnedAmount = allocations.find(allocation => allocation.allocationType === 'earned')?.nativeAmount
      if (action === 'unstake') {
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).withdraw(request.nativeAmount, {
                nonce: nextNonce(),
                gasLimit
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Unstake funds'
              })
              cacheTxMetadata(
                result.hash,
                metadataStakeCurrencyCode,
                { name: metadataName, category: 'Transfer:Staking', notes: 'Unstake funds' },
                request.nativeAmount
              )
              cacheTxMetadata(
                result.hash,
                metadataRewardCurrencyCode,
                {
                  name: metadataName,
                  category: 'Income:Staking',
                  notes: 'Reward for staked funds'
                },
                earnedAmount
              )
            })(gasLimitAcc('240000'))
        )
      }

      if (action === 'claim') {
        // Claiming withdraws all earned tokens, so we ignore the nativeAmount from the request
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).claimReward({
                nonce: nextNonce(),
                gasLimit
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Claiming reward'
              })
              cacheTxMetadata(
                result.hash,
                metadataRewardCurrencyCode,
                {
                  name: metadataName,
                  category: 'Income:Staking',
                  notes: 'Reward for staked funds'
                },
                earnedAmount
              )
            })(gasLimitAcc('240000'))
        )
      }

      //
      // Calculate the fees
      //

      // Calculate the fees:
      // 1. Get the gasPrice oracle data (from wallet)
      // 2. Calculate the networkFee as the gasLimit * gasPrice in the native token
      const gasPrice = await multipass(p => p.getGasPrice())
      const networkFee = gasLimitAcc().mul(gasPrice).toString()
      allocations.push({
        allocationType: 'fee',
        pluginId: policyInfo.parentPluginId,
        tokenId: policyInfo.parentTokenId,
        nativeAmount: networkFee
      })

      //
      // Return the quote
      //

      // Construct an approve function which executes transaction workflow (txBuilder)
      const approve: () => Promise<void> = async () => {
        await txs.run()
      }

      return {
        allocations,
        approve
      }
    },
    // TODO: Implement support for multi-asset staking
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Get the signer for the wallet
      const signerAddress = makeSigner(getSeed(wallet)).getAddress()
      const tokenContract = makeContract(policyInfo.stakeAssets[0].tokenId)

      const [stakedAmount, stakeAllocationLockTime, earnedAmount, earnedAllocationsLockTime, tokenBalance] = await Promise.all([
        // Get the amount of staked tokens:
        multipass(p => poolContract.connect(p).balanceOf(signerAddress)),
        // Get the stake allocation lock time:
        getUserUnstakeTime(signerAddress),
        // Get the earned token balance:
        multipass(p => poolContract.connect(p).earned(signerAddress)),
        // Get the earned allocations lock time:
        getUserClaimRewardTime(signerAddress),
        // Get the token balance:
        multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
      ])

      // Get staked allocations
      const stakedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.stakeAssets[0].pluginId,
          tokenId: policyInfo.stakeAssets[0].tokenId,
          allocationType: 'staked',
          nativeAmount: fromHex(stakedAmount._hex),
          locktime: stakeAllocationLockTime
        }
      ]

      // Get earned allocations
      const earnedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.rewardAssets[0].pluginId,
          tokenId: policyInfo.rewardAssets[0].tokenId,
          allocationType: 'earned',
          nativeAmount: fromHex(earnedAmount._hex),
          locktime: earnedAllocationsLockTime
        }
      ]

      //
      // Action flags
      //
      const canStake = gt(tokenBalance.toString(), '0')
      const canUnstake = gt(stakedAllocations[0].nativeAmount, '0') && stakedAllocations[0].locktime == null
      const canClaim = gt(earnedAllocations[0].nativeAmount, '0') && earnedAllocations[0].locktime == null

      return {
        allocations: [...stakedAllocations, ...earnedAllocations],
        canStake,
        canUnstake,
        canClaim
      }
    }
  }
  return instance
}
