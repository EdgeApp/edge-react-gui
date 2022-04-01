// @flow
import '@ethersproject/shims'

import { div, lte, mul } from 'biggystring'
import { ethers } from 'ethers'

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

      // TODO: Replace this assertion with an LP-contract call to get the liquidity pool ratios
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
      if (action === 'claim') {
        allocations.push(
          ...policyInfo.rewardAssets.map<QuoteAllocation>(({ tokenId }) => {
            return {
              allocationType: 'claim',
              tokenId,
              nativeAmount: request.nativeAmount
            }
          })
        )
      }

      //
      // Checks balances
      //

      // TODO: Change this algorithm to check the balance of every token in the stakeAllocations array when multiple assets are supported
      await Promise.all(
        allocations.map(async allocation => {
          // Assert if enough token balance is available
          const balanceResponse = await (async () => {
            switch (allocation.allocationType) {
              case 'stake': {
                const isNativeToken = allocation.tokenId === policyInfo.parentTokenId
                if (isNativeToken) {
                  return await multipass(p => p.getBalance(signerAddress))
                }
                const tokenContract = makeContract(allocation.tokenId)
                return await multipass(p => tokenContract.connect(p).balanceOf(signerAddress))
              }
              case 'unstake': {
                const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
                return userInfo.amount
              }
              case 'claim': {
                const userInfo = await multipass(p => poolContract.connect(p).userInfo(POOL_ID, signerAddress))
                return userInfo.rewardDebt
              }
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
      const txs = makeBuilder(async fn => await multipass(p => fn({ provider: makeSigner(signerSeed, p), p })))
      const gasLimitAcc = makeBigAccumulator('0')

      if (action === 'stake') {
        /*
        LP Liquidity Providing:

          1. Approve SpookySwap Router contract on TOMB token contract 
            example: 0xa14903af7d58dbd2f205b45371b36e8afa1e942e791c0e77cce2b613c71bfda6
            ```
            tokenContract.approve(lpRouter.address, MAX_UINT256)
            tokenContract.approve(0xF491e7B69E4244ad4002BC14e878a34207E38c29, MAX_UINT256)
            ```
          2. Add liquidity to to SpookySwap Router contract
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
        // 1. Approve Router contract for every stake token contract (excluding native token)
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

        // 2. Add liquidity to to SpookySwap Router contract
        txs.build(
          (gasLimit =>
            async function addLiquidity({ provider }) {
              // Assume only one non-native token
              const contractTokenSymbol = await tokenContract.symbol()
              const tokenAllocation = allocations.find(allocation => allocation.allocationType === 'stake' && allocation.tokenId === contractTokenSymbol)
              const nativeAllocation = allocations.find(allocation => allocation.allocationType === 'stake' && allocation.tokenId === policyInfo.parentTokenId)

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
           
        2. Withdraw the amount of LP-Pair token from Pool Contract
          ```
          poolContract.withdraw(uint256 _pid, uint256 _amount)
          poolContract.withdraw(POOL_ID, 100000000000000)
          ```
        3. Remove the liquidity from SpookySwap Router contract (using the amount of LP-Pair token withdrawn)
          ```
          lpRouter.removeLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)
          ```
      */
      if (action === 'unstake') {
        // 1. Calculate the liquidity amount (LP-Pair token amount) from the unstake-allocations
        const liquidity = 10000
        // 2. Withdraw the amount of LP-Pair token from Pool Contract
        txs.build(
          (gasLimit =>
            async function unstakeLiquidity({ provider }) {
              await poolContract.connect(provider).withdraw(0, liquidity, {
                gasLimit
              })
            })(gasLimitAcc('240000'))
        )
        // 3. Remove the liquidity from SpookySwap Router contract (using the amount of LP-Pair token withdrawn)
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

      // Get staked allocations
      const balanceOfTxResponse = await multipass(p => poolContract.connect(p).balanceOf(signerAddress))
      const stakedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.stakeAssets[0].pluginId,
          tokenId: policyInfo.stakeAssets[0].tokenId,
          allocationType: 'staked',
          nativeAmount: fromHex(balanceOfTxResponse._hex),
          locktime: undefined
        }
      ]

      // Get earned allocations
      const earnedTxRresponse = await multipass(p => poolContract.connect(p).earned(signerAddress))
      const earnedAllocations: PositionAllocation[] = [
        {
          pluginId: policyInfo.rewardAssets[0].pluginId,
          tokenId: policyInfo.rewardAssets[0].tokenId,
          allocationType: 'earned',
          nativeAmount: fromHex(earnedTxRresponse._hex),
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
