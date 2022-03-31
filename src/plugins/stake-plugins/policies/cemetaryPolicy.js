// @flow
import '@ethersproject/shims'

import { add, div, gte, lte, mul, sub } from 'biggystring'
import { ethers } from 'ethers'

import { makeContract, makeSigner, multipass } from '../contracts.js'
import { pluginInfo } from '../pluginInfo.js'
import { makeTxBuilder } from '../TxBuilder.js'
import { type PositionAllocation } from '../types'
import type { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakePosition, StakePositionRequest } from '../types.js'
import { getSeed } from '../util/getSeed.js'
import { fromHex, toHex } from '../util/hex.js'
import { type StakePluginPolicy } from './types'

export const makeCemetaryPolicy = (options?: any): StakePluginPolicy => {
  // Declare contracts:
  // TODO: Replace the hardcode with a configuration from `options`
  const poolContract = makeContract('TSHARE_REWARD_POOL')
  const lpRouter = makeContract('SPOOKY_SWAP_ROUTER')
  const pairContract = makeContract('TOMB_WFTM_LP')

  // Constants:
  // TODO: Replace DECIMAL hardcode with a configuration for each asset from `options`
  const DECIMALS = 18
  const SLIPPAGE = 0.008 // 0.8%
  const SLIPPAGE_FACTOR = 1 - SLIPPAGE // A multiplier to get a minimum amount

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
            return {
              allocationType: action,
              tokenId: tokenId,
              nativeAmount: mul(request.nativeAmount, tokenId === request.tokenId ? '1' : ratios[index])
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
            If both assets are tokens
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
            const isFullyAllowed = gte(sub(allowanceResponse._hex, toHex(allocation.nativeAmount)), '0')
            if (!isFullyAllowed) {
              txBuilder.addCall(tokenContract, 'approve', [
                spenderAddress,
                ethers.constants.MaxUint256,
                { gasLimit: { _hex: toHex('50000'), _isBigNumber: true } }
              ])
            }
          })
        )

        // 2. Add liquidity to to SpookySwap Router contract
        const lpTokenAmount = '0'
        const addLiquidityEthResponse = lpRouter.addLiquidityETH()
        txBuilder.addCall(lpRouter, 'addLiquidityETH', [
          address token, 
          uint256 amountTokenDesired, 
          uint256 amountTokenMin,
          uint256 amountETHMin, 
          address to, 
          uint256 deadline
        ])


        /*
        Staking for LP tokens:
          1. Approve TSHARE Reward Pool (0xcc0a87f7e7c693042a9cc703661f5060c80acb43) on LP-token contract (TOMB-WFTM-LP)
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
            poolContract.deposit(0, 100000000000000)
            ```
        */

        // 1. Approve Pool Contract on LP-Pair Contract:
        // const spenderAddress = poolContract.address
        // const allowanceResponse = await multipass(p => pairContract.connect(p).allowance(signerAddress, spenderAddress))
        // const isFullyAllowed = gte(sub(allowanceResponse._hex, toHex(allocation.nativeAmount)), '0')
        // if (!isFullyAllowed) {
        //   txBuilder.addCall(pairContract, 'approve', [
        //     spenderAddress,
        //     ethers.constants.MaxUint256,
        //     { gasLimit: { _hex: toHex('50000'), _isBigNumber: true } }
        //   ])
        // }

        // 2. Stake LP token
        txBuilder.addCall(poolContract, 'deposit', [
          toHex('0'),
          toHex(lpTokenAmount),
          {
            gasLimit: { _hex: toHex('240000'), _isBigNumber: true }
          }
        ])
      }

      /*
      Unstaking for LP tokens:
        1. Approve TSHARE Reward Pool on LP-token contract (TOMB-WFTM-LP)
          ```
          lpToken.approve(address _spender, uint256 _value)
          lpToken.approve(TSHARE Reward Pool, max)
          lpToken.approve(0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43, max)
          ```
        2. Withdraw LP token from Pool Contract
          ```
          poolContract.withdraw(uint256 _pid, uint256 _amount)
          poolContract.deposit(0, 100000000000000)
          ```
        3. Remove liquidity from SpookySwap Router contract
          ```
          lpRouter.removeLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)
          ```
      */
      if (action === 'unstake') {
        // 2. Unstake LP token
        txBuilder.addCall(poolContract, 'withdraw', [
          toHex(request.nativeAmount),
          {
            gasLimit: { _hex: toHex('240000'), _isBigNumber: true }
          }
        ])
      }

      /*
      Claiming for LP tokens:
        1. Approve TSHARE Reward Pool on LP-token contract (TOMB-WFTM-LP)
          ```
          lpToken.approve(address _spender, uint256 _value)
          lpToken.approve(TSHARE Reward Pool, max)
          lpToken.approve(0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43, max)
          ```
        2. Unstake LP token
          example: 0x798f29d4cd23878a564f9f68993b8a8978b632fb9138be77bf9353df37381a6b
          ```
          poolContract.deposit(uint256 _pid, uint256 _amount)
          poolContract.deposit(0, 100000000000000)
          ```
        3. Remove liquidity from SpookySwap Router contract??
      */
      if (action === 'claim') {
        // 2. Claim LP token
        // Claiming withdraws all earned tokens, so we ignore the nativeAmount from the request
        txBuilder.addCall(poolContract, 'claimReward', [
          {
            gasLimit: { _hex: toHex('240000'), _isBigNumber: true }
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
