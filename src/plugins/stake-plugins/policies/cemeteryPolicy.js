// @flow
import '@ethersproject/shims'

import { add, div, gt, gte, lte, mul, sub } from 'biggystring'
import { ethers } from 'ethers'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { getContractInfo, makeContract, makeSigner, multipass } from '../contracts.js'
import { cacheTxMetadata } from '../metadataCache'
import { pluginInfo } from '../pluginInfo.js'
import { type StakePolicyInfo } from '../stakePolicy'
import { type AssetId, type PositionAllocation } from '../types'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakePosition, StakePositionRequest } from '../types.js'
import { makeBigAccumulator } from '../util/accumulator.js'
import { round } from '../util/biggystringplus.js'
import { makeBuilder } from '../util/builder.js'
import { getSeed } from '../util/getSeed.js'
import { fromHex } from '../util/hex.js'
import { type StakePluginPolicy } from './types'

export type CemeteryPolicyOptions = {
  poolId: number,
  lpTokenContract: ethers.Contract,
  poolContract: ethers.Contract,
  swapRouterContract: ethers.Contract,
  tokenAContract: ethers.Contract,
  tokenBContract: ethers.Contract
}

export const makeCemeteryPolicy = (options: CemeteryPolicyOptions): StakePluginPolicy => {
  // Declare contracts:
  const { lpTokenContract, poolContract, swapRouterContract, tokenAContract, tokenBContract } = options

  // Constants:
  const { poolId: POOL_ID } = options
  // TODO: Replace DECIMAL hardcode with a configuration for each asset from `options`
  const DECIMALS = 18
  const SLIPPAGE = 0.03 // 3%
  const SLIPPAGE_FACTOR = 1 - SLIPPAGE // A multiplier to get a minimum amount
  const DEADLINE_OFFSET = 60 * 60 * 12 // 12 hours

  const serializeAssetId = (assetId: AssetId) => `${assetId.pluginId}:${assetId.tokenId}`

  async function lpTokenToAssetPairAmounts(
    policyInfo: StakePolicyInfo,
    lpTokenAmount: string
  ): Promise<{ [assetId: string]: { pluginId: string, tokenId: string, nativeAmount: string } }> {
    // 1. Get the total supply of LP-tokens in the LP-pool contract
    const lpTokenSupply = (await multipass(p => lpTokenContract.connect(p).totalSupply())).toString()
    // 2. Get the amount of each token reserve in the LP-pool contract
    const reservesMap = await getTokenReservesMap()
    // 3. Get the amount of each token in for the policy
    return policyInfo.stakeAssets.reduce((acc, assetId, index) => {
      const address = assetToContractAddress(policyInfo, assetId)
      const reserve = reservesMap[address]
      if (reserve == null) throw new Error(`Could not find reserve amount in liquidity pool for ${assetId.tokenId}`)
      const nativeAmount = div(mul(reserve, lpTokenAmount), lpTokenSupply)
      return { ...acc, [serializeAssetId(assetId)]: { nativeAmount } }
    }, {})
  }

  async function getExpectedLiquidityAmount(policyInfo: StakePolicyInfo, allocation: QuoteAllocation): Promise<string> {
    // 1. Calculate the liquidity amount (LP-token amount) from the unstake-allocations
    const lpTokenSupply = (await multipass(p => lpTokenContract.connect(p).totalSupply())).toString()
    const reservesMap = await getTokenReservesMap()
    const tokenContractAddress = assetToContractAddress(policyInfo, allocation)
    const tokenSupplyInReserve = reservesMap[tokenContractAddress]
    const liquidity = round(mul(div(allocation.nativeAmount, tokenSupplyInReserve, DECIMALS), fromHex(lpTokenSupply)))
    return liquidity
  }

  async function getTokenReservesMap(): Promise<{ [contractAddress: string]: string }> {
    const reservesResponse = await multipass(p => lpTokenContract.connect(p).getReserves())
    const { _reserve0, _reserve1 } = reservesResponse
    const [token0, token1] = await Promise.all([multipass(p => lpTokenContract.connect(p).token0()), multipass(p => lpTokenContract.connect(p).token1())])
    const reservesMap = {
      [token0.toLowerCase()]: _reserve0.toString(),
      [token1.toLowerCase()]: _reserve1.toString()
    }
    return reservesMap
  }

  function assetToContractAddress(policyInfo: StakePolicyInfo, assetId: AssetId): string {
    const contractInfo = getContractInfo(assetId.tokenId)
    const { address } = contractInfo
    return address.toLowerCase()
  }

  const instance: StakePluginPolicy = {
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      const requestAsset = [...policyInfo.stakeAssets, ...policyInfo.rewardAssets].find(asset => asset.tokenId === request.tokenId)
      if (requestAsset == null) throw new Error(`Asset '${request.tokenId}' not found in policy '${stakePolicyId}'`)

      const parentCurrencyCode = policyInfo.parentTokenId
      const tokenACurrencyCode = policyInfo.stakeAssets[0].tokenId
      const tokenBCurrencyCode = policyInfo.stakeAssets[1].tokenId
      const isTokenBNative = tokenBCurrencyCode === parentCurrencyCode

      // Metadata constants:
      const metadataName = 'Tomb Finance'
      const metadataLpName = `${tokenACurrencyCode} - ${tokenBCurrencyCode}`

      const signerSeed = getSeed(wallet)

      // Get the signer for the wallet
      const signerAddress = await makeSigner(signerSeed).getAddress()

      // TODO: Infer this policy from the `options` if/when we support more than two stake assets
      if (policyInfo.stakeAssets.length > 2) throw new Error(`Staking more than two assets is not supported`)

      //
      // Calculate the allocations (stake/unstake/claim) amounts
      //

      const allocations: QuoteAllocation[] = []

      // Calculate the stake asset native amounts:
      if (action === 'stake' || action === 'unstake') {
        const reservesMap = await getTokenReservesMap()
        const requestTokenContractAddress = assetToContractAddress(policyInfo, requestAsset)
        const requestTokenReserves = reservesMap[requestTokenContractAddress]

        allocations.push(
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ pluginId, tokenId }, index) => {
            const tokenContractAddress = assetToContractAddress(policyInfo, { pluginId, tokenId })
            const tokenReserves = reservesMap[tokenContractAddress]
            const nativeAmount = div(mul(tokenReserves, request.nativeAmount), requestTokenReserves)
            return {
              allocationType: action,
              pluginId,
              tokenId,
              nativeAmount
            }
          })
        )
      }
      // Calculate the claim asset native amounts:
      if (action === 'claim' || action === 'unstake') {
        const rewardNativeAmount = (await multipass(p => poolContract.connect(p).pendingShare(POOL_ID, signerAddress))).toString()
        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ tokenId, pluginId }) => {
            return {
              allocationType: 'claim',
              pluginId,
              tokenId,
              nativeAmount: rewardNativeAmount
            }
          })
        )
      }

      //
      // Build transaction workflow
      //

      // Signer
      const signer = makeSigner(signerSeed)

      // Get the gasPrice oracle data (from wallet)
      const gasPrice = await multipass(p => p.getGasPrice())

      // Accumulators
      const gasLimitAcc = makeBigAccumulator('0')
      let txCount: number = await signer.getTransactionCount('pending')
      const nextNonce = (): number => txCount++

      // Transaction builder
      const txs = makeBuilder(async fn => await multipass(provider => fn({ signer: signer.connect(provider) })))

      if (action === 'stake') {
        /*
        LP Liquidity Providing:
          1. Check balance of staked assets and unstaked LP-token to determine if the user can stake
          2. Approve Swap Router contract on non-native token contract
          3. Add liquidity to to Swap Router contract
        */

        // 1. Check balance of staked assets and unstaked LP-token to determine if the user can stake
        const lpTokenBalance = (await multipass(p => lpTokenContract.connect(p).balanceOf(signerAddress))).toString()
        const assetAmountsFromLp = await lpTokenToAssetPairAmounts(policyInfo, lpTokenBalance)
        await Promise.all(
          allocations
            .filter(allocation => allocation.allocationType === 'stake')
            .map(async allocation => {
              const balanceResponse = await (async () => {
                const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
                if (isNativeToken) {
                  return await multipass(p => p.getBalance(signerAddress))
                }
                const tokenAContract = makeContract(allocation.tokenId)
                return await multipass(p => tokenAContract.connect(p).balanceOf(signerAddress))
              })()
              const balanceAmount = fromHex(balanceResponse._hex)
              const fromLpToken = assetAmountsFromLp[serializeAssetId(allocation)].nativeAmount
              const totalBalance = add(balanceAmount, fromLpToken)
              const isBalanceEnough = lte(allocation.nativeAmount, totalBalance)
              if (!isBalanceEnough) {
                throw new Error(sprintf(s.strings.stake_error_insufficient_s, allocation.tokenId))
              }
            })
        )

        // 2. Approve Swap Router contract for every stake token contract (excluding native token)
        await Promise.all(
          allocations.map(async allocation => {
            // We don't need to approve the stake pool contract for the token earned token contract
            if (allocation.allocationType === 'claim') return
            // We don't need to approve the native token asset
            const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
            if (isNativeToken) return

            const tokenAContract = makeContract(allocation.tokenId)
            const spenderAddress = swapRouterContract.address
            const allowanceResponse = await multipass(p => tokenAContract.connect(p).allowance(signerAddress, spenderAddress))
            const isFullyAllowed = allowanceResponse.sub(allocation.nativeAmount).gte(0)
            if (!isFullyAllowed) {
              txs.build(
                (gasLimit =>
                  async function approveSwapRouter({ signer }) {
                    const result = await tokenAContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, {
                      gasLimit,
                      gasPrice,
                      nonce: nextNonce()
                    })
                    cacheTxMetadata(result.hash, parentCurrencyCode, {
                      name: metadataName,
                      category: 'Expense:Fees',
                      notes: `Approve ${metadataLpName} liquidity pool contract`
                    })
                  })(gasLimitAcc('50000'))
              )
            }
          })
        )

        // 3. Add liquidity to to Swap Router contract
        txs.build(
          ((gasLimit, lpTokenBalance) =>
            async function addLiquidity({ signer }) {
              const tokenAAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === tokenACurrencyCode)
              const tokenBAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === tokenBCurrencyCode)

              if (tokenAAllocation == null) throw new Error(`Contract token ${tokenACurrencyCode} not found in asset pair`)
              if (tokenBAllocation == null) throw new Error(`Contract token ${tokenBCurrencyCode} not found in asset pair`)

              // Existing liquidity that may be unstaked due to a previous failed attempt to stake, or some other reason
              const expectedLiquidityAmount = await getExpectedLiquidityAmount(policyInfo, tokenAAllocation)

              // Already have enough LP-tokens to cover needed amount
              if (gte(lpTokenBalance, expectedLiquidityAmount)) {
                return { liquidity: expectedLiquidityAmount }
              }

              // Figure out how much LP-tokens we need to add
              const liquidityDiffAmount = sub(expectedLiquidityAmount, lpTokenBalance)
              const assetAmountsFromLpDifference = await lpTokenToAssetPairAmounts(policyInfo, liquidityDiffAmount)
              const tokenAAmountFromLpDifference = assetAmountsFromLpDifference[serializeAssetId(tokenAAllocation)].nativeAmount
              const tokenBAmountFromLpDifference = assetAmountsFromLpDifference[serializeAssetId(tokenBAllocation)].nativeAmount

              // Prepare the contract parameters
              const amountTokenADesired = tokenAAmountFromLpDifference
              const amountTokenAMin = round(mul(tokenAAmountFromLpDifference, SLIPPAGE_FACTOR.toString()))
              const amountTokenBDesired = tokenBAmountFromLpDifference
              const amountTokenBMin = round(mul(tokenBAmountFromLpDifference, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              let result
              if (isTokenBNative) {
                // Call the contract
                result = await swapRouterContract
                  .connect(signer)
                  .addLiquidityETH(tokenAContract.address, amountTokenADesired, amountTokenAMin, amountTokenBMin, signerAddress, deadline, {
                    gasLimit,
                    gasPrice,
                    nonce: nextNonce(),
                    value: amountTokenBDesired
                  })
              } else {
                // Call the contract
                result = await swapRouterContract
                  .connect(signer)
                  .addLiquidity(
                    tokenAContract.address,
                    tokenBContract.address,
                    amountTokenADesired,
                    amountTokenBDesired,
                    amountTokenAMin,
                    amountTokenBMin,
                    signerAddress,
                    deadline,
                    {
                      gasLimit,
                      gasPrice,
                      nonce: nextNonce()
                    }
                  )
                cacheTxMetadata(result.hash, parentCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: `Provide liquidity for ${metadataLpName} - LP`
                })
              }

              // Cache metadata
              cacheTxMetadata(
                result.hash,
                tokenACurrencyCode,
                {
                  name: metadataName,
                  category: 'Transfer:Staking',
                  notes: `Provide liquidity for ${metadataLpName} - LP`
                },
                amountTokenADesired
              )
              cacheTxMetadata(
                result.hash,
                tokenBCurrencyCode,
                {
                  name: metadataName,
                  category: 'Transfer:Staking',
                  notes: `Provide liquidity for ${metadataLpName} - LP`
                },
                amountTokenBDesired
              )

              //
              // Decode the log data in the receipt to get the liquidity token transfer amount
              //
              const receipt = await result.wait(1)
              const transferTopicHash = ethers.utils.id('Transfer(address,address,uint256)')
              const transferTopics = receipt.logs.filter(log => log.topics[0] === transferTopicHash)
              // The last token transfer log is the LP-token transfer
              const lpTokenTransfer = transferTopics.slice(-1)[0]
              const decodedData = ethers.utils.defaultAbiCoder.decode(['uint256'], lpTokenTransfer.data)
              const addedLiquidityAmount = decodedData[0].toString()

              return { liquidity: add(addedLiquidityAmount, lpTokenBalance) }
            })(gasLimitAcc('450000'), lpTokenBalance)
        )

        /*
        Staking for LP tokens:
          1. Approve Pool Contract on LP-Contract:
          2. Stake LP token
        */

        // 1. Approve Pool Contract on LP-Contract:
        txs.build(
          (gasLimit =>
            async function approveStakingPool({ signer, liquidity }) {
              const spenderAddress = poolContract.address
              const allowanceResponse = await lpTokenContract.connect(signer).allowance(signerAddress, spenderAddress)
              const isFullyAllowed = allowanceResponse.sub(liquidity).gte('0')
              if (!isFullyAllowed) {
                const result = await lpTokenContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, {
                  gasLimit,
                  gasPrice,
                  nonce: nextNonce()
                })
                cacheTxMetadata(result.hash, parentCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: `Approve ${metadataLpName} rewards pool contract`
                })
              }
            })(gasLimitAcc('50000'))
        )

        // 2. Stake LP token
        txs.build(
          (gasLimit =>
            async function stakeLiquidity({ signer, liquidity }) {
              const result = await poolContract.connect(signer).deposit(POOL_ID, liquidity, {
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })

              // Amounts need to be calculated here
              cacheTxMetadata(result.hash, parentCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fee',
                notes: `Stake into ${metadataLpName} reward pool`
              })
            })(gasLimitAcc('240000'))
        )
      }

      /*
      Unstaking for LP tokens:
        1. Calculate the liquidity amount (LP-token amount) from the unstake-allocations
        2. Check liquidity amount balance
        3. Withdraw LP-token from Pool Contract
        4. Remove the liquidity from Swap Router contract (using the amount of LP-token withdrawn)
      */
      if (action === 'unstake') {
        const lpTokenBalance = (await multipass(p => lpTokenContract.connect(p).balanceOf(signerAddress))).toString()

        const tokenAAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === tokenACurrencyCode)
        const tokenBAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === tokenBCurrencyCode)

        if (tokenAAllocation == null) throw new Error(`Contract token ${tokenACurrencyCode} not found in asset pair`)
        if (tokenBAllocation == null) throw new Error(`Contract token ${tokenBCurrencyCode} not found in asset pair`)

        // 1. Calculate the liquidity amount (LP-token amount) from the unstake-allocations
        const expectedLiquidityAmount = await getExpectedLiquidityAmount(policyInfo, tokenAAllocation)

        // 2. Check liquidity amount balances
        const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
        const stakedLpTokenBalance = fromHex(userInfo.amount._hex)
        const totalLpTokenBalance = add(lpTokenBalance, stakedLpTokenBalance)
        const isBalanceEnough = gte(totalLpTokenBalance, expectedLiquidityAmount)
        if (!isBalanceEnough) {
          throw new Error(sprintf(s.strings.stake_error_insufficient_s, tokenACurrencyCode))
        }

        // 3. Withdraw LP-token from Pool Contract
        txs.build(
          ((gasLimit, lpTokenBalance) =>
            async function unstakeLiquidity({ signer }) {
              const amountToUnstake = sub(expectedLiquidityAmount, lpTokenBalance)

              // We don't need to unstake liquidity from the pool
              if (lte(amountToUnstake, '0')) return

              const result = await poolContract.connect(signer).withdraw(POOL_ID, amountToUnstake, {
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })
              // Reward transaction metadata
              policyInfo.rewardAssets
                .map(asset => asset.tokenId)
                .forEach(currencyCode => {
                  cacheTxMetadata(result.hash, currencyCode, {
                    name: metadataName,
                    category: 'Income:Staking',
                    notes: `Claimed rewards from ${metadataLpName}`
                  })
                })
              cacheTxMetadata(result.hash, parentCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Unstake and claim rewards from ${metadataLpName} reward pool`
              })
            })(gasLimitAcc('240000'), lpTokenBalance)
        )

        // 4. Allow Swap on the LP-token contract
        const spenderAddress = swapRouterContract.address
        const allowanceResponse = await multipass(p => lpTokenContract.connect(p).allowance(signerAddress, spenderAddress))
        const isAllowed = allowanceResponse.sub(expectedLiquidityAmount).gte(0)
        if (!isAllowed) {
          txs.build(
            (gasLimit =>
              async function approveSwapRouter({ signer }) {
                const result = await lpTokenContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, {
                  gasLimit,
                  gasPrice,
                  nonce: nextNonce()
                })
                cacheTxMetadata(result.hash, parentCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: `Approve ${metadataLpName} liquidity pool contract`
                })
              })(gasLimitAcc('50000'))
          )
        }

        // 4. Remove the liquidity from Swap Router contract (using the amount of LP-token withdrawn)
        txs.build(
          (gasLimit =>
            async function removeLiquidity({ signer }) {
              const amountTokenAMin = round(mul(tokenAAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const amountTokenBMin = round(mul(tokenBAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              let result
              if (isTokenBNative) {
                result = await swapRouterContract
                  .connect(signer)
                  .removeLiquidityETH(tokenAContract.address, expectedLiquidityAmount, amountTokenAMin, amountTokenBMin, signerAddress, deadline, {
                    gasLimit,
                    gasPrice,
                    nonce: nextNonce()
                  })
              } else {
                result = await swapRouterContract
                  .connect(signer)
                  .removeLiquidity(
                    tokenAContract.address,
                    tokenBContract.address,
                    expectedLiquidityAmount,
                    amountTokenAMin,
                    amountTokenBMin,
                    signerAddress,
                    deadline,
                    {
                      gasLimit,
                      gasPrice,
                      nonce: nextNonce()
                    }
                  )
                cacheTxMetadata(result.hash, parentCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: 'Remove liquidity from ' + metadataLpName + ' - LP'
                })
              }

              cacheTxMetadata(result.hash, tokenACurrencyCode, {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: 'Remove liquidity from ' + metadataLpName + ' - LP'
              })
              cacheTxMetadata(result.hash, tokenBCurrencyCode, {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: 'Remove liquidity from ' + metadataLpName + ' - LP'
              })
            })(gasLimitAcc('500000'))
        )
      }

      /*
      Claiming for LP tokens:
        1. Withdraw reward by removing 0 liquidity from Swap Router contract
      */
      if (action === 'claim') {
        // 1. Withdraw reward by removing 0 liquidity from Swap Router contract
        // Claiming withdraws all earned tokens
        txs.build(
          (gasLimit =>
            async function claimReward({ signer }) {
              const result = await poolContract.connect(signer).withdraw(POOL_ID, 0, {
                gasLimit,
                gasPrice,
                nonce: nextNonce()
              })

              policyInfo.rewardAssets
                .map(asset => asset.tokenId)
                .forEach(currencyCode => {
                  cacheTxMetadata(result.hash, currencyCode, {
                    name: metadataName,
                    category: 'Income:Staking',
                    notes: `Claimed rewards from ${metadataLpName}`
                  })
                })
              cacheTxMetadata(result.hash, parentCurrencyCode, {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Claimed rewards from ${metadataLpName}`
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
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      const tokenBCurrencyCode = policyInfo.stakeAssets[1].tokenId
      const isTokenBNative = tokenBCurrencyCode === policyInfo.parentTokenId

      // Get the signer for the wallet
      const signerAddress = makeSigner(getSeed(wallet)).getAddress()

      const [{ stakedLpTokenBalance, assetAmountsFromLp }, rewardNativeAmount, tokenABalance, tokenBBalance, lpTokenBalance] = await Promise.all([
        // Get staked allocations:
        // 1. Get the amount of LP-tokens staked in the pool contract
        multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress)).then(async userStakePoolInfo => {
          const stakedLpTokenBalance = userStakePoolInfo.amount.toString()
          // 2. Get the conversion amounts for each stakeAsset using the staked LP-token amount
          const assetAmountsFromLp = await lpTokenToAssetPairAmounts(policyInfo, stakedLpTokenBalance)
          return { stakedLpTokenBalance, assetAmountsFromLp }
        }),
        // Get reward amount:
        multipass(p => poolContract.connect(p).pendingShare(POOL_ID, signerAddress)).then(String),
        // Get token A balance:
        multipass(p => tokenAContract.connect(p).balanceOf(signerAddress)).then(String),
        // Get token B balance:
        multipass(p => (isTokenBNative ? p.getBalance(signerAddress) : tokenBContract.balanceOf(signerAddress))).then(String),
        // Get LP token balance:
        multipass(p => lpTokenContract.connect(p).balanceOf(signerAddress)).then(String)
      ])

      // 3. Use the conversion amounts to create the staked allocations
      const stakedAllocations: PositionAllocation[] = policyInfo.stakeAssets.map((assetId, index) => {
        const { nativeAmount } = assetAmountsFromLp[serializeAssetId(assetId)]
        if (nativeAmount == null) throw new Error(`Could not find reserve amount in liquidity pool for ${assetId.tokenId}`)

        return {
          pluginId: assetId.pluginId,
          tokenId: assetId.tokenId,
          allocationType: 'staked',
          nativeAmount,
          locktime: undefined
        }
      })

      // Get earned allocations:
      const earnedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.rewardAssets[0].pluginId,
          tokenId: policyInfo.rewardAssets[0].tokenId,
          allocationType: 'earned',
          nativeAmount: rewardNativeAmount,
          locktime: undefined
        }
      ]

      //
      // Actions available for the user:
      //

      // You can stake if you have balances in the paired assets, or some unstaked LP-Token balance
      const canStake = (gt(tokenABalance, '0') && gt(tokenBBalance, '0')) || gt(lpTokenBalance, '0')

      // You can unstake so long as there is some staked LP-Token balance (there are no timelocks)
      const canUnstake = gt(stakedLpTokenBalance, '0')

      // You can claim so long as there is some reward balance (there are no timelocks)
      const canClaim = gt(rewardNativeAmount, '0')

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
