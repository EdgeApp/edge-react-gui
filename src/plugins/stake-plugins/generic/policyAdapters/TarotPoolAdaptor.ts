import '@ethersproject/shims'

import { eq } from 'biggystring'
import { EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import {
  Erc20__factory,
  TarotBorrowable__factory,
  TarotCollateral__factory,
  TarotRouter__factory,
  VelodromeLPToken__factory,
  VelodromeRouterV2__factory
} from '../../../contracts'
import { AssetId, ChangeQuote, PositionAllocation, QuoteAllocation, StakePosition } from '../../types'
import { StakePolicyConfig } from '../types'
import { EdgeWalletSigner } from '../util/EdgeWalletSigner'
import { tarotUtils } from '../util/tarotUtils'
import { StakePolicyAdapter } from './types'

export interface TarotPoolAdapterConfig {
  type: 'tarot-velodrome-pool'
  rpcProviderUrls: string[]
  poolContractAddress: string
  token0: {
    contractAddress: string
    symbol: string
    decimals: number
    tokenId: string
  }
  token1: {
    contractAddress: string
    symbol: string
    decimals: number
    tokenId: string
  }
  lpToken: {
    contractAddress: string
    symbol: string
  }
  collateralContractAddress: string
  token0BorrowableContractAddress: string
  token1BorrowableContractAddress: string
  tarotRouterContractAddress: string
  velodromeRouterContractAddress: string
  velodromeFactoryContractAddress: string
  isStable: boolean
  isTarotVault: boolean
}

const SLIPPAGE = 0.02 // 2%
const SLIPPAGE_FACTOR = 1 + SLIPPAGE // A multiplier to get a minimum amount
const DEADLINE_OFFSET = 60 * 60 * 12 // 12 hours

type ChainableTransaction = (previousTx?: ethers.providers.TransactionResponse) => Promise<ethers.PopulatedTransaction>

export const makeTarotPoolAdapter = (policyConfig: StakePolicyConfig<TarotPoolAdapterConfig>): StakePolicyAdapter => {
  if (policyConfig.stakeAssets.length !== 2) throw new Error(`Staking more or less than two assets is not supported for TarotPoolAdapter`)

  if (
    policyConfig.stakeAssets[0].currencyCode !== policyConfig.rewardAssets[0].currencyCode ||
    policyConfig.stakeAssets[1].currencyCode !== policyConfig.rewardAssets[1].currencyCode
  )
    throw new Error(`Stake and claim of different assets is not supported for TarotPoolAdapter`)

  // Metadata constants:
  const metadataName = 'Tarot LP Token Leveraged Pool'
  const metadataPoolAssetName = `${policyConfig.stakeAssets[0].currencyCode}/${policyConfig.stakeAssets[1].currencyCode}`

  const { adapterConfig, stakePolicyId } = policyConfig
  const {
    rpcProviderUrls,
    poolContractAddress,
    token0,
    token1,
    lpToken,
    collateralContractAddress,
    token0BorrowableContractAddress,
    token1BorrowableContractAddress,
    tarotRouterContractAddress,
    velodromeRouterContractAddress,
    velodromeFactoryContractAddress,
    isStable
  } = adapterConfig
  const provider = new ethers.providers.FallbackProvider(rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url)))

  async function prepareChangeQuote(walletSigner: EdgeWalletSigner, txs: ChainableTransaction[], allocations: QuoteAllocation[]): Promise<ChangeQuote> {
    let networkFee = BigNumber.from(0)

    for (const makeTx of txs) {
      const populatedTx = await makeTx()
      populatedTx.chainId = 10
      if (populatedTx.gasLimit == null) {
        const estimatedGasLimit = await walletSigner.estimateGas(populatedTx)
        populatedTx.gasLimit = estimatedGasLimit.mul(2)
      }
      const gasLimit = populatedTx.gasLimit
      const maxFeePerGas = BigNumber.from(populatedTx.gasPrice ?? 0)
      networkFee = networkFee.add(gasLimit.mul(maxFeePerGas))
    }

    allocations.push({
      allocationType: 'networkFee',
      pluginId: policyConfig.parentPluginId,
      currencyCode: policyConfig.parentCurrencyCode,
      nativeAmount: networkFee.toString()
    })

    const approve = async () => {
      let txResponse: ethers.providers.TransactionResponse | undefined
      let nonce: number | undefined
      for (const makeTx of txs) {
        if (nonce == null) {
          nonce = await walletSigner.getTransactionCount('latest')
        }
        nonce++
        const populatedTransaction = await makeTx(txResponse)
        populatedTransaction.nonce = nonce
        txResponse = await walletSigner.sendTransaction(populatedTransaction)
      }
    }

    return {
      allocations,
      approve
    }
  }

  async function workflowUtils(wallet: EdgeCurrencyWallet) {
    const txs: ChainableTransaction[] = []

    const walletSigner = new EdgeWalletSigner(wallet, provider)
    const walletAddress = await walletSigner.getAddress()

    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice != null ? feeData.gasPrice : undefined

    return { gasPrice, txs, walletAddress, walletSigner }
  }

  const instance = {
    stakePolicyId,
    fetchStakeQuote: async (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> => {
      const { gasPrice, txs, walletAddress, walletSigner } = await workflowUtils(wallet)

      // determine both amounts
      const velodromeRouterContract = VelodromeRouterV2__factory.connect(velodromeRouterContractAddress, provider)
      const lpTokenContract = VelodromeLPToken__factory.connect(lpToken.contractAddress, provider)
      const token0Contract = Erc20__factory.connect(token0.contractAddress, provider)
      const token1Contract = Erc20__factory.connect(token1.contractAddress, provider)
      const [reserve0, reserve1] = await lpTokenContract.getReserves()

      let token0Amount: BigNumber
      let token1Amount: BigNumber
      if (requestAssetId.currencyCode === token0.symbol) {
        token0Amount = BigNumber.from(nativeAmount)
        token1Amount = BigNumber.from(token0Amount).mul(reserve1).div(reserve0)
      } else if (requestAssetId.currencyCode === token1.symbol) {
        token1Amount = BigNumber.from(nativeAmount)
        token0Amount = BigNumber.from(token1Amount).mul(reserve0).div(reserve1)
      } else {
        throw new Error('Unrecognized symbol')
      }

      // check if we have enough balance to cover amounts
      const token0Balance = wallet.balances[token0.symbol]
      const token1Balance = wallet.balances[token1.symbol]
      if (token0Amount.gt(token0Balance) || token1Amount.gt(token1Balance)) throw new InsufficientFundsError()

      // see if we need to add approval transactions
      const token0ApprovedAmount = await token0Contract.allowance(walletAddress, velodromeRouterContractAddress)
      if (token0ApprovedAmount.lt(token0Amount)) {
        txs.push(
          async () =>
            await token0Contract.populateTransaction.approve(velodromeRouterContractAddress, token0Amount, {
              gasPrice,
              gasLimit: '60000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve ${token0.symbol} for ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }

      const token1ApprovedAmount = await token1Contract.allowance(walletAddress, velodromeRouterContractAddress)
      if (token1ApprovedAmount.lt(token1Amount)) {
        txs.push(
          async () =>
            await token1Contract.populateTransaction.approve(velodromeRouterContractAddress, token1Amount, {
              gasPrice,
              gasLimit: '60000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve ${token1.symbol} for ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }

      // get liquidity quote
      const amountToken0Min = token0Amount.mul(100).div(100 * SLIPPAGE_FACTOR)
      const amountToken1Min = token1Amount.mul(100).div(100 * SLIPPAGE_FACTOR)

      const [amountA, amountB, estimateMinLiquidity] = await velodromeRouterContract.quoteAddLiquidity(
        token0.contractAddress,
        token1.contractAddress,
        isStable,
        velodromeFactoryContractAddress,
        token0Amount,
        token1Amount
      )

      // approve lp token spending to router contract
      const lpTokenAllowance = await lpTokenContract.allowance(walletAddress, tarotRouterContractAddress)
      if (lpTokenAllowance.lt(estimateMinLiquidity)) {
        txs.push(
          async () =>
            await lpTokenContract.populateTransaction.approve(tarotRouterContractAddress, estimateMinLiquidity, {
              gasPrice,
              gasLimit: '60000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve ${lpToken.symbol} for ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }

      // create addLiquidity transaction
      const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET
      txs.push(
        async () =>
          await velodromeRouterContract.populateTransaction.addLiquidity(
            token0.contractAddress,
            token1.contractAddress,
            isStable,
            amountA,
            amountB,
            amountA.mul(100).div(100 * SLIPPAGE_FACTOR),
            amountB.mul(100).div(100 * SLIPPAGE_FACTOR),
            walletAddress,
            deadline,
            {
              gasPrice,
              gasLimit: '500000',
              customData: {
                name: metadataName,
                category: 'Transfer:Staking',
                notes: `Add liquidity to ${metadataPoolAssetName} liquidity pool contract`
              }
            }
          )
      )

      // mint collateral
      const tarotRouterContract = TarotRouter__factory.connect(tarotRouterContractAddress, provider)
      txs.push(async (prevTx?: ethers.providers.TransactionResponse) => {
        let addedLiquidityAmount = estimateMinLiquidity
        if (prevTx != null) {
          const receipt = await prevTx.wait(1)

          const eventLogs = receipt.logs.filter(log => log.address.toLowerCase() === lpTokenContract.address.toLowerCase())
          const log = eventLogs.filter(
            log => log.topics[0] === lpTokenContract.interface.getEventTopic(lpTokenContract.interface.events['Transfer(address,address,uint256)'])
          )[0]

          if (log == null) throw new Error('Cannot find log with amount')

          const decodedData = ethers.utils.defaultAbiCoder.decode(['uint256'], log.data)[0]

          if (BigNumber.isBigNumber(decodedData)) {
            addedLiquidityAmount = decodedData
          }
        }
        return await tarotRouterContract.populateTransaction.mintCollateral(collateralContractAddress, addedLiquidityAmount, walletAddress, deadline, '0x', {
          gasPrice,
          gasLimit: '500000',
          customData: {
            name: metadataName,
            category: 'Transfer:Staking',
            notes: `Mint collateral to ${metadataPoolAssetName} liquidity pool contract`
          }
        })
      })

      // approve borrow tokens
      const token0BorrowableContract = TarotBorrowable__factory.connect(token0BorrowableContractAddress, provider)
      const [token0BorrowableAllowance, token0BorrowableTotalSupply] = await Promise.all([
        await token0BorrowableContract.allowance(walletAddress, tarotRouterContractAddress),
        await token0BorrowableContract.totalSupply()
      ])
      if (token0BorrowableAllowance.lt(token0BorrowableTotalSupply)) {
        txs.push(
          async () =>
            await token0BorrowableContract.populateTransaction.borrowApprove(tarotRouterContractAddress, ethers.constants.MaxUint256, {
              gasPrice,
              gasLimit: '1000000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve bTarot for ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }
      const token1BorrowableContract = TarotBorrowable__factory.connect(token1BorrowableContractAddress, provider)
      const [token1BorrowableAllowance, token1BorrowableTotalSupply] = await Promise.all([
        await token1BorrowableContract.allowance(walletAddress, tarotRouterContractAddress),
        await token1BorrowableContract.totalSupply()
      ])
      if (token1BorrowableAllowance.lt(token1BorrowableTotalSupply)) {
        txs.push(
          async () =>
            await token1BorrowableContract.populateTransaction.borrowApprove(tarotRouterContractAddress, ethers.constants.MaxUint256, {
              gasPrice,
              gasLimit: '1000000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve bTarot ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }

      // do the leverage
      txs.push(async (prevTx?: ethers.providers.TransactionResponse) => {
        if (prevTx != null) {
          await prevTx.wait(1)
        }
        return await tarotRouterContract.populateTransaction.leverage(
          poolContractAddress,
          token0Amount,
          token1Amount,
          amountToken0Min,
          amountToken1Min,
          walletAddress,
          deadline,
          '0x',
          '0x',
          {
            gasPrice,
            gasLimit: '10000000',
            customData: {
              name: metadataName,
              category: 'Transfer:Staking',
              notes: `Leverage ${metadataPoolAssetName} liquidity pool contract`
            }
          }
        )
      })

      // Calculate the stake asset native amounts:
      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: policyConfig.stakeAssets[0].pluginId,
          currencyCode: policyConfig.stakeAssets[0].currencyCode,
          nativeAmount: token0Amount.toString()
        },
        {
          allocationType: 'stake',
          pluginId: policyConfig.stakeAssets[1].pluginId,
          currencyCode: policyConfig.stakeAssets[1].currencyCode,
          nativeAmount: token1Amount.toString()
        }
      ]

      return await prepareChangeQuote(walletSigner, txs, allocations)
    },
    fetchUnstakeQuote: async (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> => {
      const { gasPrice, txs, walletAddress, walletSigner } = await workflowUtils(wallet)
      const collateralContract = TarotCollateral__factory.connect(collateralContractAddress, provider)
      const tarotRouterContract = TarotRouter__factory.connect(tarotRouterContractAddress, provider)

      const tarot = tarotUtils(adapterConfig, provider, walletAddress)

      // approve collateral token
      const [collateralAllowance, collateralTotalSupply] = await Promise.all([
        await collateralContract.allowance(walletAddress, tarotRouterContractAddress),
        await collateralContract.totalSupply()
      ])
      if (collateralAllowance.lt(collateralTotalSupply)) {
        txs.push(
          async () =>
            await collateralContract.populateTransaction.approve(tarotRouterContractAddress, ethers.constants.MaxUint256, {
              gasPrice,
              gasLimit: '60000',
              customData: {
                name: metadataName,
                category: 'Expense:Fees',
                notes: `Approve cTarot for ${metadataPoolAssetName} liquidity pool contract`
              }
            })
        )
      }

      const max = await tarot.getMaxDeleverage()
      const amounts = await tarot.getDeleverageAmounts(max)
      const collateralBalance = await collateralContract.balanceOf(walletAddress)
      const deadline = Math.round(Date.now() / 1000) + DEADLINE_OFFSET

      const bAmountAMin = tarot.decimalToBalance(amounts.bAmountAMin)
      const bAmountBMin = tarot.decimalToBalance(amounts.bAmountBMin)

      txs.push(
        async () =>
          await tarotRouterContract.populateTransaction.deleverage(poolContractAddress, collateralBalance, bAmountAMin, bAmountBMin, deadline, '0x', {
            gasPrice,
            gasLimit: '1000000',
            customData: {
              name: metadataName,
              category: 'Transfer:Staking',
              notes: `Deleverage ${metadataPoolAssetName} liquidity pool contract`
            }
          })
      )

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: policyConfig.stakeAssets[0].pluginId,
          currencyCode: policyConfig.stakeAssets[0].currencyCode,
          nativeAmount: bAmountAMin.toString()
        },
        {
          allocationType: 'unstake',
          pluginId: policyConfig.stakeAssets[1].pluginId,
          currencyCode: policyConfig.stakeAssets[1].currencyCode,
          nativeAmount: bAmountBMin.toString()
        }
      ]

      return await prepareChangeQuote(walletSigner, txs, allocations)
    },
    fetchClaimQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => {
      throw new Error('fetchClaimQuote not implemented for TarotPoolAdapter')
    },
    fetchUnstakeExactQuote: async (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> => {
      throw new Error('fetchUnstakeExactQuote not implemented for TarotPoolAdapter')
    },
    fetchStakePosition: async (wallet: EdgeCurrencyWallet): Promise<StakePosition> => {
      const token0BorrowableContract = TarotBorrowable__factory.connect(token0BorrowableContractAddress, provider)
      const token1BorrowableContract = TarotBorrowable__factory.connect(token1BorrowableContractAddress, provider)
      const [token0Asset, token1Asset] = policyConfig.stakeAssets
      const { walletAddress } = await workflowUtils(wallet)

      const tarot = tarotUtils(adapterConfig, provider, walletAddress)

      function getPositionAllocation(token: AssetId, nativeAmount: string): PositionAllocation {
        return {
          pluginId: token.pluginId,
          currencyCode: token.currencyCode,
          allocationType: 'staked',
          nativeAmount,
          locktime: undefined
        }
      }

      const allocations: PositionAllocation[] = []
      const token0AccruedBalance = await tarot.getAccruedBalance(token0BorrowableContract, walletAddress)
      const token0NativeAmount = token0AccruedBalance.toString()
      allocations.push(getPositionAllocation(token0Asset, token0NativeAmount))

      const token1AccruedBalance = await tarot.getAccruedBalance(token1BorrowableContract, walletAddress)
      const token1NativeAmount = token1AccruedBalance.toString()
      allocations.push(getPositionAllocation(token1Asset, token1NativeAmount))

      //
      // Actions available for the user:
      //

      const token0WalletBalance = wallet.balances[token0Asset.currencyCode] ?? '0'
      const token1WalletBalance = wallet.balances[token1Asset.currencyCode] ?? '0'

      // Can stake if wallet has balances for each token and they don't currently any of the borrowable
      const canStake = !eq(token0WalletBalance, '0') && !eq(token1WalletBalance, '0') && eq(token0NativeAmount, '0') && eq(token1NativeAmount, '0')

      // Can unstakeAndClaim if they have borrowable balances
      const canUnstake = !eq(token0NativeAmount, '0') && !eq(token1NativeAmount, '0')

      return {
        allocations,
        canStake,
        canUnstake,
        canUnstakeAndClaim: false,
        canClaim: false
      }
    },
    fetchYieldInfo: async () => {
      return {
        apy: undefined,
        yieldType: undefined
      }
    }
  }

  return instance
}
