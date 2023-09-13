import { gt, lte } from 'biggystring'
import { BigNumber } from 'ethers'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../../locales/strings'
import { cacheTxMetadata } from '../../metadataCache'
import { ChangeQuote, ChangeQuoteRequest, PositionAllocation, QuoteAllocation, StakePosition, StakePositionRequest } from '../../types'
import { makeBigAccumulator } from '../../util/accumulator'
import { makeBuilder } from '../../util/builder'
import { fromHex } from '../../util/hex'
import { pluginInfo } from '../pluginInfo'
import { fantomEcosystem as eco } from '../policyInfo/fantom'
import { StakePluginPolicy } from '../types'

const HOUR = 1000 * 60 * 60

export interface MasonryPolicyOptions {
  disableStake?: boolean
  disableUnstake?: boolean
  disableClaim?: boolean
}

export const makeMasonryPolicy = (options?: MasonryPolicyOptions): StakePluginPolicy => {
  const { disableStake = false, disableUnstake = false, disableClaim = false } = options ?? {}

  // Get the pool contract necessary for the staking
  // TODO: Replace the hardcode with a configuration from initOptions
  const poolContract = eco.makeContract('TOMB_MASONRY')
  const treasuryContract = eco.makeContract('TOMB_TREASURY')

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to claim
   * their reward from the masonry or void if there is no wait time.
   * @param {string} accountAddress - The address of the account
   * @returns Promise<Date | undefined>
   */
  async function getUserClaimRewardTime(accountAddress: string): Promise<Date | undefined> {
    const nextEpochTimestamp = await eco.multipass(p => poolContract.connect(p).nextEpochPoint()) // in unix timestamp
    const currentEpoch = await eco.multipass(p => poolContract.connect(p).epoch())
    const mason = await eco.multipass(p => poolContract.connect(p).masons(accountAddress))
    const startTimeEpoch = mason.epochTimerStart
    const period = await eco.multipass(p => treasuryContract.connect(p).PERIOD())
    const periodInHours = period / 60 / 60 // 6 hours, period is displayed in seconds which is 21600
    const rewardLockupEpochs = await eco.multipass(p => poolContract.connect(p).rewardLockupEpochs())
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
   * @returns Promise<Date | undefined>
   */
  async function getUserUnstakeTime(accountAddress: string): Promise<Date | undefined> {
    const nextEpochTimestamp = await eco.multipass(p => poolContract.connect(p).nextEpochPoint())
    const currentEpoch = await eco.multipass(p => poolContract.connect(p).epoch())
    const mason = await eco.multipass(p => poolContract.connect(p).masons(accountAddress))
    const startTimeEpoch = mason.epochTimerStart
    const period = await eco.multipass(p => treasuryContract.connect(p).PERIOD())
    const periodInHours = period / 60 / 60
    const withdrawLockupEpochs = await eco.multipass(p => poolContract.connect(p).withdrawLockupEpochs())
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
      const { action, stakePolicyId, wallet, account } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Metadata constants:
      const metadataName = 'Tomb Finance'
      const nativeCurrencyCode = policyInfo.parentCurrencyCode
      const metadataStakeCurrencyCode = policyInfo.stakeAssets.map(asset => asset.currencyCode)[0]
      const metadataRewardCurrencyCode = policyInfo.rewardAssets.map(asset => asset.currencyCode)[0]

      // Get the signer for the wallet
      const signerSeed = await account.getDisplayPrivateKey(wallet.id)
      const signerAddress = eco.makeSigner(signerSeed).getAddress()

      // TODO: Replace this assertion with an LP-contract call to get the liquidity pool ratios
      if (policyInfo.stakeAssets.length > 1) throw new Error(`Multi-asset staking is not supported`)

      //
      // Calculate the allocations (stake/unstake/claim) amounts
      //

      const allocations: QuoteAllocation[] = []

      // Calculate the stake asset native amounts:
      if (action === 'stake' || action === 'unstake') {
        allocations.push(
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ currencyCode, pluginId }) => {
            if (currencyCode !== request.currencyCode) throw new Error(`Requested token '${request.currencyCode}' to ${action} not found in policy`)

            return {
              allocationType: action,
              pluginId,
              currencyCode,
              nativeAmount: request.nativeAmount
            }
          })
        )
      }
      // Calculate the claim asset native amounts:
      if (action === 'claim' || action === 'unstake') {
        const earnedAmount = (await eco.multipass(p => poolContract.connect(p).earned(signerAddress))).toString()
        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ currencyCode, pluginId }) => {
            return {
              allocationType: 'claim',
              pluginId,
              currencyCode,
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
            return await eco.multipass(p => poolContract.connect(p).canWithdraw(signerAddress))
          case 'claim':
            return await eco.multipass(p => poolContract.connect(p).canClaimReward(signerAddress))
          default:
            return true
        }
      })()
      if (!checkTxResponse) throw new Error(`Cannot ${action} for token '${request.currencyCode}'`)

      // TODO: Change this algorithm to check the balance of every token in the stakeAllocations array when multiple assets are supported
      await Promise.all(
        allocations.map(async allocation => {
          // Assert if enough token balance is available
          const balanceResponse = await (async () => {
            switch (allocation.allocationType) {
              case 'stake': {
                const tokenContract = eco.makeContract(allocation.currencyCode)
                return await eco.multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
              }
              case 'unstake':
                return await eco.multipass(p => poolContract.connect(p).balanceOf(signerAddress))
              case 'claim':
                return await eco.multipass(p => poolContract.connect(p).earned(signerAddress))
              case 'networkFee':
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
            throw new Error(sprintf(lstrings.stake_error_insufficient_s, request.currencyCode))
          }
        })
      )

      //
      // Build transaction workflow
      //

      // Signer
      const signer = eco.makeSigner(signerSeed)

      // Get the gasPrice oracle data (from wallet)
      const gasPrice = await eco.multipass(async p => await p.getGasPrice())

      // Accumulators
      const gasLimitAcc = makeBigAccumulator('0')
      let txCount: number = await signer.getTransactionCount('pending')
      const nextNonce = (): number => txCount++

      // Transaction builder
      const txs = makeBuilder(async fn => await eco.multipass(provider => fn({ signer: signer.connect(provider) })))

      // Stake the Stake-Token Workflow:
      // 1. Send approve() TX on Stake-Token-Contract if allowance is not MaxUint256
      // 2. Send Stake TX on Pool-Contract

      await Promise.all(
        allocations.map(async allocation => {
          // We don't need to approve the stake pool contract for the token earned token contract
          if (allocation.allocationType === 'claim') return
          const tokenContract = eco.makeContract(allocation.currencyCode)
          txs.build(
            (gasLimit =>
              async function approvePoolContract({ signer }) {
                const result = await tokenContract.connect(signer).approve(poolContract.address, BigNumber.from(allocation.nativeAmount), {
                  gasLimit,
                  gasPrice,
                  nonce: nextNonce()
                })
                cacheTxMetadata(result.hash, nativeCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: 'Approve staking rewards pool contract'
                })
              })(gasLimitAcc('50000'))
          )
        })
      )

      // Action transaction (Stake/Unstake/Claim)
      if (action === 'stake') {
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).stake(request.nativeAmount, {
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Stake funds'
              })
              cacheTxMetadata(result.hash, metadataStakeCurrencyCode, { name: metadataName, category: 'Transfer:Staking', notes: 'Stake funds' })
            })(gasLimitAcc('240000'))
        )
      }

      if (action === 'unstake') {
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).withdraw(request.nativeAmount, {
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Unstake funds'
              })
              cacheTxMetadata(result.hash, metadataStakeCurrencyCode, { name: metadataName, category: 'Transfer:Staking', notes: 'Unstake funds' })
              cacheTxMetadata(result.hash, metadataRewardCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: 'Reward for staked funds'
              })
            })(gasLimitAcc('240000'))
        )
      }

      if (action === 'claim') {
        // Claiming withdraws all earned tokens, so we ignore the nativeAmount from the request
        txs.build(
          (gasLimit =>
            async function name({ signer }) {
              const result = await poolContract.connect(signer).claimReward({
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: 'Claiming reward'
              })
              cacheTxMetadata(result.hash, metadataRewardCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: 'Reward for staked funds'
              })
            })(gasLimitAcc('240000'))
        )
      }

      //
      // Calculate the fees
      //

      // Calculate the networkFee as the gasLimit * gasPrice in the native token
      const networkFee = gasLimitAcc().mul(gasPrice).toString()
      allocations.push({
        allocationType: 'networkFee',
        pluginId: policyInfo.parentPluginId,
        currencyCode: policyInfo.parentCurrencyCode,
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
      const { stakePolicyId, wallet, account } = request
      const signerSeed = await account.getDisplayPrivateKey(wallet.id)

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Get the signer for the wallet
      const signerAddress = eco.makeSigner(signerSeed).getAddress()
      const tokenContract = eco.makeContract(policyInfo.stakeAssets[0].currencyCode)

      const [stakedAmount, stakeAllocationLockTime, earnedAmount, earnedAllocationsLockTime, tokenBalance] = await Promise.all([
        // Get the amount of staked tokens:
        eco.multipass(p => poolContract.connect(p).balanceOf(signerAddress)),
        // Get the stake allocation lock time:
        // @ts-expect-error
        getUserUnstakeTime(signerAddress),
        // Get the earned token balance:
        eco.multipass(p => poolContract.connect(p).earned(signerAddress)),
        // Get the earned allocations lock time:
        // @ts-expect-error
        getUserClaimRewardTime(signerAddress),
        // Get the token balance:
        eco.multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
      ])

      // Get staked allocations
      const stakedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.stakeAssets[0].pluginId,
          currencyCode: policyInfo.stakeAssets[0].currencyCode,
          allocationType: 'staked',
          nativeAmount: fromHex(stakedAmount._hex),
          locktime: stakeAllocationLockTime
        }
      ]

      // Get earned allocations
      const earnedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.rewardAssets[0].pluginId,
          currencyCode: policyInfo.rewardAssets[0].currencyCode,
          allocationType: 'earned',
          nativeAmount: fromHex(earnedAmount._hex),
          locktime: earnedAllocationsLockTime
        }
      ]

      //
      // Action flags
      //
      const canStake = !disableStake && gt(tokenBalance.toString(), '0')
      const canUnstake = !disableUnstake && gt(stakedAllocations[0].nativeAmount, '0') && stakedAllocations[0].locktime == null
      const canClaim = !disableClaim && gt(earnedAllocations[0].nativeAmount, '0') && earnedAllocations[0].locktime == null

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
