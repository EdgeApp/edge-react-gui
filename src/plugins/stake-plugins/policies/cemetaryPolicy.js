// @flow
import '@ethersproject/shims'

import { div, lte, mul } from 'biggystring'
import { BigNumber, ethers } from 'ethers'

import { makeContract, makeSigner, multipass } from '../contracts.js'
import { pluginInfo } from '../pluginInfo.js'
import { type PositionAllocation } from '../types'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakePosition, StakePositionRequest } from '../types.js'
import { makeBigAccumulator } from '../util/accumulator.js'
import { round } from '../util/biggystringplus.js'
import { makeBuilder } from '../util/builder.js'
import { getSeed } from '../util/getSeed.js'
import { fromHex } from '../util/hex.js'
import { type StakePluginPolicy } from './types'

export const makeCemetaryPolicy = (options?: any): StakePluginPolicy => {
  // Declare contracts:
  // TODO: Replace the hardcode with a configuration from `options`
  const poolContract = makeContract('TSHARE_REWARD_POOL')
  const lpRouter = makeContract('SPOOKY_SWAP_ROUTER')
  const pairContract = makeContract('TOMB_WFTM_LP')
  const tokenContract = makeContract('TOMB')

  // Constants:
  // TODO: Replace the hardcode with a configuration from `options`
  const POOL_ID = 0
  // TODO: Replace DECIMAL hardcode with a configuration for each asset from `options`
  const DECIMALS = 18
  const DECIMAL_FACTOR = BigNumber.from((10 ** DECIMALS).toString())
  const SLIPPAGE = 0.008 // 0.8%
  const SLIPPAGE_FACTOR = 1 - SLIPPAGE // A multiplier to get a minimum amount
  const DEADLINE_OFFSET = 60 * 60 * 24 // 24 hours

  const instance: StakePluginPolicy = {
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      const signerSeed = getSeed(wallet)

      // Get the signer for the wallet
      const signerAddress = makeSigner(signerSeed).getAddress()

      // TODO: Infer this policy from the `options`
      if (policyInfo.stakeAssets.length > 2) throw new Error(`Staking more than two assets is not supported`)

      //
      // Calculate the allocations (stake/unstake/claim) amounts
      //

      const allocations: QuoteAllocation[] = []

      // Calculate the stake asset native amounts:
      if (action === 'stake' || action === 'unstake') {
        const reservesResponse = await multipass(p => pairContract.connect(p).getReserves())
        const { _reserve0, _reserve1 } = reservesResponse
        const ratios = [div(fromHex(_reserve0._hex), fromHex(_reserve1._hex), DECIMALS), div(fromHex(_reserve1._hex), fromHex(_reserve0._hex), DECIMALS)]

        allocations.push(
          ...policyInfo.stakeAssets.map<QuoteAllocation>(({ tokenId }, index) => {
            const ratio = tokenId === request.tokenId ? '1' : ratios[index]
            return {
              allocationType: action,
              tokenId: tokenId,
              nativeAmount: round(mul(request.nativeAmount, ratio))
            }
          })
        )
      }
      // Calculate the claim asset native amounts:
      if (action === 'claim' || action === 'unstake') {
        const rewardNativeAmount = (await multipass(p => poolContract.connect(p).pendingShare(POOL_ID, signerAddress))).toString()
        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ tokenId }) => {
            return {
              allocationType: 'claim',
              tokenId,
              nativeAmount: rewardNativeAmount
            }
          })
        )
      }

      //
      // Build transaction workflow
      //

      // An array of all the transactions to dispatch upon approval
      const txs = makeBuilder(async fn => await multipass(p => fn({ provider: makeSigner(signerSeed, p), p })))
      const gasLimitAcc = makeBigAccumulator('0')

      if (action === 'stake') {
        /*
        LP Liquidity Providing:

          1. Check balance of staked assets
          2. Approve SpookySwap Router contract on TOMB token contract 
            example: 0xa14903af7d58dbd2f205b45371b36e8afa1e942e791c0e77cce2b613c71bfda6
            ```
            tokenContract.approve(lpRouter.address, MAX_UINT256)
            tokenContract.approve(0xF491e7B69E4244ad4002BC14e878a34207E38c29, MAX_UINT256)
            ```
          3. Add liquidity to to SpookySwap Router contract
            example: 0xf2c133e1548d86aaefe9078d7ea5bbf4f6acd7eae8d7c0e17c9e2ba43bf1911d

            If one asset is native:
            ```
            lpRouter.addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)
            lpRouter.addLiquidityETH(0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7, 1000000000000000, 992000000000000, 987214927033744, 0x3616b4903e4Ebf7671129BdD540fBc58dc63e67e, 1648675557)
            lpRouter.addLiquidityETH(TOMB TOKEN, 1000000000000000, 992000000000000, 987214927033744, signerAddress, 1648675557)
            ```
            TODO: If both assets are tokens
            ```
            lpRouter.addLiquidity(...)
            ```
        */

        // 1. Check balance of staked assets
        await Promise.all(
          allocations
            .filter(allocation => allocation.allocationType === 'stake')
            .map(async allocation => {
              const balanceResponse = await (async () => {
                const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
                if (isNativeToken) {
                  return await multipass(p => p.getBalance(signerAddress))
                }
                const tokenContract = makeContract(allocation.tokenId)
                return await multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
              })()
              const balanceAmount = fromHex(balanceResponse._hex)
              const isBalanceEnough = lte(allocation.nativeAmount, balanceAmount)
              if (!isBalanceEnough) {
                throw new Error(`Cannot withdraw '${allocation.nativeAmount}' with '${allocation.tokenId}' token balance ${balanceAmount}`)
              }
            })
        )

        // 2. Approve Router contract for every stake token contract (excluding native token)
        await Promise.all(
          allocations.map(async allocation => {
            // We don't need to approve the stake pool contract for the token earned token contract
            if (allocation.allocationType === 'claim') return
            // We don't need to approve the native token asset
            const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
            if (isNativeToken) return

            const tokenContract = makeContract(allocation.tokenId)
            const spenderAddress = lpRouter.address
            const allowanceResponse = await multipass(p => tokenContract.connect(p).allowance(signerAddress, spenderAddress))
            const isFullyAllowed = allowanceResponse.sub(allocation.nativeAmount).gte(0)
            if (!isFullyAllowed) {
              txs.build(
                (gasLimit =>
                  async function approveLiquidityPool({ provider }) {
                    await tokenContract.connect(provider).approve(spenderAddress, ethers.constants.MaxUint256, { gasLimit })
                  })(gasLimitAcc('50000'))
              )
            }
          })
        )

        // 3. Add liquidity to to SpookySwap Router contract
        txs.build(
          (gasLimit =>
            async function addLiquidity({ provider }) {
              // Assume only one non-native token
              const contractTokenSymbol = await tokenContract.symbol()
              const tokenAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === contractTokenSymbol)
              const nativeAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === policyInfo.parentTokenId)

              if (tokenAllocation == null) throw new Error(`Contract token ${contractTokenSymbol} not found in asset pair`)
              if (nativeAllocation == null) throw new Error(`Native token ${policyInfo.parentTokenId} not found in asset pair`)

              const amountTokenDesired = tokenAllocation.nativeAmount
              const amountTokenMin = round(mul(tokenAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const amountNative = nativeAllocation.nativeAmount
              const amountNativeMin = round(mul(nativeAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              const result = await lpRouter
                .connect(provider)
                .addLiquidityETH(tokenContract.address, amountTokenDesired, amountTokenMin, amountNativeMin, signerAddress, deadline, {
                  gasLimit,
                  value: amountNative
                })
              const receipt = await result.wait(1)

              //
              // Decode the log data in the receipt to get the liquidity token transfer amount
              //
              const transferTopicHash = ethers.utils.id('Transfer(address,address,uint256)')
              const transferTopics = receipt.logs.filter(log => log.topics[0] === transferTopicHash)
              // The last token transfer log is the LP-Pair token transfer
              const lpTokenTransfer = transferTopics.slice(-1)[0]
              const decodedData = ethers.utils.defaultAbiCoder.decode(['uint256'], lpTokenTransfer.data)
              const [liquidity] = decodedData

              return { liquidity }
            })(gasLimitAcc('450000'))
        )

        /*
        Staking for LP tokens:
          1. Approve Pool Contract on LP-Pair Contract:
            ```
            lpToken.approve(address _spender, uint256 _value)
            lpToken.approve(TSHARE Reward Pool, max)
            lpToken.approve(0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43, max)
            ```
          2. Stake LP token
            example: 0x798f29d4cd23878a564f9f68993b8a8978b632fb9138be77bf9353df37381a6b
            Call deposit on TSHARE Reward Pool (0xcc0a87f7e7c693042a9cc703661f5060c80acb43)
            ```
            poolContract.deposit(uint256 _pid, uint256 _amount)
            poolContract.deposit(POOL_ID, 100000000000000)
            ```
        */

        // 1. Approve Pool Contract on LP-Pair Contract:
        txs.build(
          (gasLimit =>
            async function approveStakingPool({ provider, liquidity }) {
              const spenderAddress = poolContract.address
              const allowanceResponse = await multipass(p => pairContract.connect(p).allowance(signerAddress, spenderAddress))
              const isFullyAllowed = allowanceResponse.sub(liquidity).gte('0')
              if (!isFullyAllowed) {
                await pairContract.approve(spenderAddress, ethers.constants.MaxUint256, { gasLimit })
              }
            })(gasLimitAcc('50000'))
        )

        // 2. Stake LP token
        txs.build(
          (gasLimit =>
            async function stakeLiquidity({ provider, liquidity }) {
              await poolContract.connect(provider).deposit(POOL_ID, liquidity, {
                gasLimit
              })
            })(gasLimitAcc('240000'))
        )
      }

      /*
      Unstaking for LP tokens:
        1. Calculate the liquidity amount (LP-Pair token amount) from the unstake-allocations
           
        2. Check liquidity amount balance

        3. Withdraw the amount of LP-Pair token from Pool Contract
          ```
          poolContract.withdraw(uint256 _pid, uint256 _amount)
          poolContract.withdraw(POOL_ID, 100000000000000)
          ```
        4. Remove the liquidity from SpookySwap Router contract (using the amount of LP-Pair token withdrawn)
          ```
          lpRouter.removeLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)
          ```
      */
      if (action === 'unstake') {
        const contractTokenSymbol = await tokenContract.symbol()
        const tokenAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === contractTokenSymbol)
        const nativeAllocation = allocations.find(allocation => allocation.allocationType === action && allocation.tokenId === policyInfo.parentTokenId)

        if (tokenAllocation == null) throw new Error(`Contract token ${contractTokenSymbol} not found in asset pair`)
        if (nativeAllocation == null) throw new Error(`Native token ${policyInfo.parentTokenId} not found in asset pair`)

        // 1. Calculate the liquidity amount (LP-Pair token amount) from the unstake-allocations
        const lpTokenSupply = await multipass(p => pairContract.connect(p).totalSupply())
        const reservesResponse = await multipass(p => pairContract.connect(p).getReserves())
        const { _reserve0 } = reservesResponse
        const tokenSupplyInReserve = _reserve0
        const liquidity = round(mul(div(tokenAllocation.nativeAmount, fromHex(tokenSupplyInReserve._hex), DECIMALS), fromHex(lpTokenSupply._hex)))

        // 2. Check liquidity amount balance
        const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
        const balanceAmount = fromHex(userInfo.amount._hex)
        const isBalanceEnough = lte(liquidity, balanceAmount)
        if (!isBalanceEnough) {
          const lpSymbol = await pairContract.symbol()
          throw new Error(`Cannot withdraw ${liquidity} ${lpSymbol} with liquidity balance ${balanceAmount}`)
        }

        // 3. Withdraw the amount of LP-Pair token from Pool Contract
        txs.build(
          (gasLimit =>
            async function unstakeLiquidity({ provider }) {
              await poolContract.connect(provider).withdraw(0, liquidity, {
                gasLimit
              })
            })(gasLimitAcc('240000'))
        )

        // 4. Allow LP-Router on the LP-Pair token contract
        const spenderAddress = lpRouter.address
        const allowanceResponse = await multipass(p => pairContract.connect(p).allowance(signerAddress, spenderAddress))
        const isAllowed = allowanceResponse.sub(liquidity).gte(0)
        if (!isAllowed) {
          txs.build(
            (gasLimit =>
              async function approveRouter({ provider }) {
                await pairContract.connect(provider).approve(spenderAddress, ethers.constants.MaxUint256, { gasLimit })
              })(gasLimitAcc('50000'))
          )
        }
        // txs.build(buildApproveCall(pairContract, signerAddress, lpRouter.address, liquidity, gasLimitAcc))

        // 4. Remove the liquidity from SpookySwap Router contract (using the amount of LP-Pair token withdrawn)
        txs.build(
          (gasLimit =>
            async function unstakeLiquidity({ provider }) {
              const amountTokenMin = round(mul(tokenAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const amountNativeMin = round(mul(nativeAllocation.nativeAmount, SLIPPAGE_FACTOR.toString()))
              const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

              await lpRouter.connect(provider).removeLiquidityETH(tokenContract.address, liquidity, amountTokenMin, amountNativeMin, signerAddress, deadline, {
                gasLimit
              })
            })(gasLimitAcc('500000'))
        )
      }

      /*
      Claiming for LP tokens:
        1. Withdraw reward by removing 0 liquidity from SpookySwap Router contract
      */
      if (action === 'claim') {
        // 1. Withdraw reward by removing 0 liquidity from SpookySwap Router contract
        // Claiming withdraws all earned tokens
        txs.build(
          (gasLimit =>
            async function claimReward({ provider }) {
              await poolContract.connect(provider).withdraw(0, 0, {
                gasLimit
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
      const gasPrice = (await multipass(provider => provider.getGasPrice()))._hex
      const networkFee = gasLimitAcc().mul(gasPrice).toString()
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
        await txs.run()
      }

      console.log(txs.inspect())

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

      // Get staked allocations:
      // 1. Get the amount of LP-Pair tokens staked in the pool contract
      const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
      const lpTokenBalance = userInfo.amount
      // 2. Get the total supply of LP-Pair tokens in the LP-Pair pool contract
      const lpTokenSupply = await multipass(p => pairContract.connect(p).totalSupply())
      // 3. Get the amount of each token reserve in the LP-Pair pool contract
      const reservesResponse = await multipass(p => pairContract.connect(p).getReserves())
      const { _reserve0, _reserve1 } = reservesResponse
      const reserves = [_reserve0, _reserve1]
      // 4. Do the conversion calculation between LP-Pair token to each of the tokens in the pool
      const stakedAllocations: PositionAllocation[] = policyInfo.stakeAssets.map((asset, index) => {
        const reserve = reserves[index]
        if (reserve == null) throw new Error(`Could not find reserve amount in liquidity pool for ${asset.tokenId}`)
        const nativeAmount = round(mul(div(lpTokenBalance.toString(), lpTokenSupply.toString(), DECIMALS), reserve.toString()))
        return {
          pluginId: asset.pluginId,
          tokenId: asset.tokenId,
          allocationType: 'staked',
          nativeAmount,
          locktime: undefined
        }
      })

      // Get earned allocations:
      const rewardNativeAmount = (await multipass(p => poolContract.connect(p).pendingShare(POOL_ID, signerAddress))).toString()
      const earnedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.rewardAssets[0].pluginId,
          tokenId: policyInfo.rewardAssets[0].tokenId,
          allocationType: 'earned',
          nativeAmount: rewardNativeAmount,
          locktime: undefined
        }
      ]

      return {
        allocations: [...stakedAllocations, ...earnedAllocations]
      }
    }
  }

  return instance
}
