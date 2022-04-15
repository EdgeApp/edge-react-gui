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
import { type PositionAllocation } from '../types'
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
  // TODO: Implement this to support TOMB-MAI-LP pool
  // An undefined token B contract means that the pool pair is the wrapped-native token
  tokenBContract?: ethers.Contract
}

export const makeCemeteryPolicy = (options: CemeteryPolicyOptions): StakePluginPolicy => {
  // Declare contracts:
  const { lpTokenContract, poolContract, swapRouterContract, tokenAContract } = options

  // Constants:
  const { poolId: POOL_ID } = options
  // TODO: Replace DECIMAL hardcode with a configuration for each asset from `options`
  const DECIMALS = 18
  const SLIPPAGE = 0.03 // 3%
  const SLIPPAGE_FACTOR = 1 - SLIPPAGE // A multiplier to get a minimum amount
  const DEADLINE_OFFSET = 60 * 60 * 12 // 12 hours

  const toAssetId = (asset: { pluginId: string, tokenId: string }) => `${asset.pluginId}:${asset.tokenId}`

  async function lpTokenToAssetPairAmounts(
    policyInfo: StakePolicyInfo,
    lpTokenAmount: string
  ): Promise<{ [assetId: string]: { pluginId: string, tokenId: string, nativeAmount: string } }> {
    // 1. Get the total supply of LP-tokens in the LP-pool contract
    const lpTokenSupply = (await multipass(p => lpTokenContract.connect(p).totalSupply())).toString()
    // 2. Get the amount of each token reserve in the LP-pool contract
    const reservesMap = await getTokenReservesMap()
    // 3. Get the amount of each token in for the policy
    return policyInfo.stakeAssets.reduce((acc, asset, index) => {
      const address = assetToContractAddress(policyInfo, asset)
      const reserve = reservesMap[address.toLowerCase()]
      if (reserve == null) throw new Error(`Could not find reserve amount in liquidity pool for ${asset.tokenId}`)
      const assetId = toAssetId(asset)
      const nativeAmount = div(mul(reserve, lpTokenAmount), lpTokenSupply)
      return { ...acc, [assetId]: { nativeAmount } }
    }, {})
  }

  async function getExpectedLiquidityAmount(policyInfo: StakePolicyInfo, allocation: QuoteAllocation): Promise<string> {
    // 1. Calculate the liquidity amount (LP-token amount) from the unstake-allocations
    const lpTokenSupply = (await multipass(p => lpTokenContract.connect(p).totalSupply())).toString()
    const reservesMap = await getTokenReservesMap()
    const tokenContractAddress = assetToContractAddress(policyInfo, allocation).toLowerCase()
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

  function assetToContractAddress(policyInfo: StakePolicyInfo, asset: { pluginId: string, tokenId: string }): string {
    // If the asset is the native token
    if (asset.tokenId === policyInfo.parentTokenId) {
      // Return the WFTM contract address
      // TODO: replace hard-code with a map from pluginId to contract address
      return '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
    }
    const contractInfo = getContractInfo(asset.tokenId)
    const { address } = contractInfo
    return address
  }

  const instance: StakePluginPolicy = {
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      const signerSeed = getSeed(wallet)

      // Get the signer for the wallet
      const signerAddress = await makeSigner(signerSeed).getAddress()

      // TODO: Infer this policy from the `options`
      if (policyInfo.stakeAssets.length > 2) throw new Error(`Staking more than two assets is not supported`)

      //
      // Calculate the allocations (stake/unstake/claim) amounts
      //

      const allocations: QuoteAllocation[] = []

      // Calculate the stake asset native amounts:
      if (action === 'stake' || action === 'unstake') {
        const reservesResponse = await multipass(p => lpTokenContract.connect(p).getReserves())
        const { _reserve0, _reserve1 } = reservesResponse
        const ratios = [div(fromHex(_reserve1._hex), fromHex(_reserve0._hex), DECIMALS), div(fromHex(_reserve0._hex), fromHex(_reserve1._hex), DECIMALS)]

        allocations.push(
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ tokenId, pluginId }, index) => {
            const ratio = tokenId === request.tokenId ? '1' : ratios[index]
            return {
              allocationType: action,
              pluginId,
              tokenId,
              nativeAmount: round(mul(request.nativeAmount, ratio))
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

      // Accumulators
      const gasLimitAcc = makeBigAccumulator('0')
      let txCount: number = await signer.getTransactionCount()
      const nextNonce = (): number => txCount++

      // Metadata constants:
      const metadataName = 'Tomb Finance'
      const nativeCurrencyCode = policyInfo.parentTokenId
      const metadataTokenCurrencyCode = policyInfo.stakeAssets[0].tokenId
      const metadataLpName = `${metadataTokenCurrencyCode} - ${nativeCurrencyCode}`

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
              const assetId = toAssetId(allocation)
              const balanceResponse = await (async () => {
                const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
                if (isNativeToken) {
                  return await multipass(p => p.getBalance(signerAddress))
                }
                const tokenAContract = makeContract(allocation.tokenId)
                return await multipass(p => tokenAContract.connect(p).balanceOf(signerAddress))
              })()
              const balanceAmount = fromHex(balanceResponse._hex)
              const fromLpToken = assetAmountsFromLp[assetId].nativeAmount
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
                  async function approveLiquidityPool({ signer }) {
                    const result = await tokenAContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, { gasLimit, nonce: nextNonce() })
                    cacheTxMetadata(result.hash, nativeCurrencyCode, {
                      name: metadataName,
                      category: 'Expense:Fees',
                      notes: `Approve ${metadataLpName} rewards pool contract`
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
              // Assume only one non-native token
              const contractTokenSymbol = await tokenAContract.symbol()
              const tokenAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === contractTokenSymbol)
              const nativeAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === policyInfo.parentTokenId)

              if (tokenAllocation == null) throw new Error(`Contract token ${contractTokenSymbol} not found in asset pair`)
              if (nativeAllocation == null) throw new Error(`Native token ${policyInfo.parentTokenId} not found in asset pair`)

              // Existing liquidity that may be unstaked due to a previous failed attempt to stake, or some other reason
              const expectedLiquidityAmount = await getExpectedLiquidityAmount(policyInfo, tokenAllocation)

              // Already have enough LP-tokens to cover needed amount
              if (gte(lpTokenBalance, expectedLiquidityAmount)) {
                return { liquidity: expectedLiquidityAmount }
              }

              // Figure out how much LP-tokens we need to add
              const liquidityDiffAmount = sub(expectedLiquidityAmount, lpTokenBalance)
              const assetAmountsFromLpDifference = await lpTokenToAssetPairAmounts(policyInfo, liquidityDiffAmount)
              const tokenAmountFromLpDifference = assetAmountsFromLpDifference[toAssetId(tokenAllocation)].nativeAmount
              const nativeAmountFromLpDifference = assetAmountsFromLpDifference[toAssetId(nativeAllocation)].nativeAmount

              // Prepare the contract parameters
              const amountTokenDesired = tokenAmountFromLpDifference
              const amountTokenMin = round(mul(tokenAmountFromLpDifference, SLIPPAGE_FACTOR.toString()))
              const amountNative = nativeAmountFromLpDifference
              const amountNativeMin = round(mul(nativeAmountFromLpDifference, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              // Call the contract
              // TODO: Use 'addLiquidity' If both assets are tokens
              const result = await swapRouterContract
                .connect(signer)
                .addLiquidityETH(tokenAContract.address, amountTokenDesired, amountTokenMin, amountNativeMin, signerAddress, deadline, {
                  nonce: nextNonce(),
                  gasLimit,
                  value: amountNative
                })

              // Cache metadata
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: 'Stake into ' + metadataLpName + ' LP'
              })
              cacheTxMetadata(
                result.hash,
                metadataTokenCurrencyCode,
                { name: metadataName, category: 'Transfer:Staking', notes: 'Stake into ' + metadataLpName + ' LP' },
                amountTokenDesired
              )

              const receipt = await result.wait(1)

              //
              // Decode the log data in the receipt to get the liquidity token transfer amount
              //
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
                const result = await lpTokenContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, { nonce: nextNonce(), gasLimit })

                cacheTxMetadata(result.hash, nativeCurrencyCode, {
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
              const result = await poolContract.connect(signer).deposit(POOL_ID, liquidity, { nonce: nextNonce(), gasLimit })

              // Amounts need to be calculated here
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: `Stake into ${metadataLpName} Reward Pool`
              })
              cacheTxMetadata(result.hash, metadataTokenCurrencyCode, {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: `Stake into ${metadataLpName} Reward Pool`
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

        const contractTokenSymbol = await tokenAContract.symbol()
        const tokenAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === contractTokenSymbol)
        const nativeAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === policyInfo.parentTokenId)

        if (tokenAllocation == null) throw new Error(`Contract token ${contractTokenSymbol} not found in asset pair`)
        if (nativeAllocation == null) throw new Error(`Native token ${policyInfo.parentTokenId} not found in asset pair`)

        // 1. Calculate the liquidity amount (LP-token amount) from the unstake-allocations
        const expectedLiquidityAmount = await getExpectedLiquidityAmount(policyInfo, tokenAllocation)

        // 2. Check liquidity amount balances
        const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
        const stakedLpTokenBalance = fromHex(userInfo.amount._hex)
        const totalLpTokenBalance = add(lpTokenBalance, stakedLpTokenBalance)
        const isBalanceEnough = gte(totalLpTokenBalance, expectedLiquidityAmount)
        if (!isBalanceEnough) {
          throw new Error(sprintf(s.strings.stake_error_insufficient_s, contractTokenSymbol))
        }

        // 3. Withdraw LP-token from Pool Contract
        txs.build(
          ((gasLimit, lpTokenBalance) =>
            async function unstakeLiquidity({ signer }) {
              const amountToUnstake = sub(expectedLiquidityAmount, lpTokenBalance)

              // We don't need to unstake liquidity from the pool
              if (lte(amountToUnstake, '0')) return

              const result = await poolContract.connect(signer).withdraw(POOL_ID, amountToUnstake, { nonce: nextNonce(), gasLimit })
              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: `Unstake from ${metadataLpName} Reward Pool`
              })
              cacheTxMetadata(result.hash, metadataTokenCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: `Unstake from ${metadataLpName} Reward Pool`
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
              async function approveRouter({ signer }) {
                const result = await lpTokenContract.connect(signer).approve(spenderAddress, ethers.constants.MaxUint256, { nonce: nextNonce(), gasLimit })
                cacheTxMetadata(result.hash, nativeCurrencyCode, {
                  name: metadataName,
                  category: 'Expense:Fees',
                  notes: `Approve ${metadataLpName} rewards pool contract`
                })
              })(gasLimitAcc('50000'))
          )
        }

        // 4. Remove the liquidity from Swap Router contract (using the amount of LP-token withdrawn)
        txs.build(
          (gasLimit =>
            async function removeLiquidity({ signer }) {
              const amountTokenMin = round(mul(tokenAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const amountNativeMin = round(mul(nativeAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              const result = await swapRouterContract
                .connect(signer)
                .removeLiquidityETH(tokenAContract.address, expectedLiquidityAmount, amountTokenMin, amountNativeMin, signerAddress, deadline, {
                  nonce: nextNonce(),
                  gasLimit
                })

              cacheTxMetadata(result.hash, nativeCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: 'Unstake from ' + metadataLpName + ' LP'
              })
              cacheTxMetadata(result.hash, metadataTokenCurrencyCode, {
                name: metadataName,
                category: 'Income:Staking',
                notes: 'Unstake from ' + metadataLpName + ' LP'
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
              const result = await poolContract.connect(signer).withdraw(POOL_ID, 0, { nonce: nextNonce(), gasLimit })

              policyInfo.rewardAssets
                .map(asset => asset.tokenId)
                .forEach(currencyCode => {
                  cacheTxMetadata(result.hash, currencyCode, { name: 'Tomb Finance', notes: `Claimed ${currencyCode} rewards from ${metadataLpName}` })
                })
              cacheTxMetadata(result.hash, policyInfo.parentTokenId, {
                name: 'Tomb Finance',
                category: 'Expense:Fees',
                notes: `Fees for claim reward`
              })
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
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      // Get the signer for the wallet
      const signerAddress = makeSigner(getSeed(wallet)).getAddress()

      const [{ stakedLpTokenBalance, assetAmountsFromLp }, rewardNativeAmount, nativeTokenBalance, tokenABalance, lpTokenBalance] = await Promise.all([
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
        // Get native token balance:
        multipass(p => p.getBalance(signerAddress)).then(String),
        // Get token A balance:
        multipass(p => tokenAContract.connect(p).balanceOf(signerAddress)).then(String),
        // Get LP token balance:
        multipass(p => lpTokenContract.connect(p).balanceOf(signerAddress)).then(String)
      ])

      // 3. Use the conversion amounts to create the staked allocations
      const stakedAllocations: PositionAllocation[] = policyInfo.stakeAssets.map((asset, index) => {
        const assetId = toAssetId(asset)
        const { nativeAmount } = assetAmountsFromLp[assetId]
        if (nativeAmount == null) throw new Error(`Could not find reserve amount in liquidity pool for ${asset.tokenId}`)

        return {
          pluginId: asset.pluginId,
          tokenId: asset.tokenId,
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
      const canStake = (gt(tokenABalance, '0') && gt(nativeTokenBalance, '0')) || gt(lpTokenBalance, '0')

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
