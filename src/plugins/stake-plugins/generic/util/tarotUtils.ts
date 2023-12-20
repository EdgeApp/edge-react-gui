import { BigNumber, ethers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

import {
  Erc20,
  Erc20__factory,
  TarotBorrowable,
  TarotBorrowable__factory,
  TarotCollateral,
  TarotCollateral__factory,
  VelodromeLPToken,
  VelodromeLPToken__factory,
  VelodromePoolV2,
  VelodromePoolV2__factory
} from '../../../contracts'
import { TarotPoolAdapterConfig } from '../policyAdapters/TarotPoolAdaptor'

const TEN_18 = BigNumber.from(10).pow(18)
const SLIPPAGE = 0.02 // 2%
const SLIPPAGE_FACTOR = 1 + SLIPPAGE // A multiplier to get a minimum amount

// tarot.to types
export enum TarotPoolTokenType {
  Collateral = 'collateral',
  BorrowableA = 'borrowable0',
  BorrowableB = 'borrowable1'
}
export interface BigAmount {
  amount: BigNumber
  decimals: BigNumber
}

export type TarotBorrowableContracts = [TarotBorrowable, Erc20, VelodromePoolV2]
type TarotCollateralContracts = [TarotCollateral, VelodromeLPToken, VelodromePoolV2]
export interface TarotContractGroups {
  [TarotPoolTokenType.BorrowableA]: TarotBorrowableContracts
  [TarotPoolTokenType.BorrowableB]: TarotBorrowableContracts
  [TarotPoolTokenType.Collateral]: TarotCollateralContracts
}

/**
 * These utils have been copied from tarot.to and minimally changed to work in the stake plugin.
 * To avoid math errors and interoperability between utils, no code cleanups were attempted.
 */

export const tarotUtils = (config: TarotPoolAdapterConfig, provider: ethers.providers.FallbackProvider, walletAddress: string) => {
  const poolContract = VelodromePoolV2__factory.connect(config.poolContractAddress, provider)
  const lpTokenContract = VelodromeLPToken__factory.connect(config.lpToken.contractAddress, provider)
  const token0Contract = Erc20__factory.connect(config.token0.contractAddress, provider)
  const token1Contract = Erc20__factory.connect(config.token1.contractAddress, provider)
  const token0BorrowableContract = TarotBorrowable__factory.connect(config.token0BorrowableContractAddress, provider)
  const token1BorrowableContract = TarotBorrowable__factory.connect(config.token1BorrowableContractAddress, provider)
  const collateralContract = TarotCollateral__factory.connect(config.collateralContractAddress, provider)

  return {
    async getAccruedBalance(contract: TarotBorrowable, walletAddress: string): Promise<BigNumber> {
      const [borrowBalance, accrualTimestamp, borrowRate] = await Promise.all([
        contract.borrowBalance(walletAddress),
        contract.accrualTimestamp(),
        contract.borrowRate()
      ])

      const totalAmount = borrowBalance.add(
        borrowBalance
          .mul(60000 + Date.now() - accrualTimestamp * 1000)
          .mul(borrowRate)
          .div(TEN_18)
          .div(1000)
      )
      return totalAmount
    },

    async getReserves(): Promise<[number, number]> {
      const [reserve0, reserve1] = await lpTokenContract.getReserves()
      return [parseFloat(formatUnits(reserve0, config.token0.decimals)), parseFloat(formatUnits(reserve1, config.token1.decimals))]
    },

    // Used for calculating max deleverage. Future variable deleverage will use nativeAmount to determine these values
    NO_CHANGES: {
      changeBorrowedA: 0,
      changeBorrowedB: 0,
      changeCollateral: 0
    } as const,

    async getLPTotalSupply(): Promise<number> {
      const pairTotalSupply = await lpTokenContract.totalSupply()
      return parseFloat(formatUnits(pairTotalSupply, 18))
    },

    async getMarketPriceDenomLP(): Promise<[number, number]> {
      const [[reserve0, reserve1], totalSupply] = await Promise.all([this.getReserves(), this.getLPTotalSupply()])
      let ret: [number, number]
      if (config.isStable) {
        const x2 = reserve0 * reserve0
        const y2 = reserve1 * reserve1
        const f = (3 * x2 + y2) / (x2 + 3 * y2)
        ret = [((totalSupply / reserve0) * f) / (1 + f), totalSupply / reserve1 / (1 + f)]
      } else {
        ret = [totalSupply / reserve0 / 2, totalSupply / reserve1 / 2]
      }
      return ret
    },

    async getContracts(poolTokenType: TarotPoolTokenType): Promise<TarotContractGroups[typeof poolTokenType]> {
      if (poolTokenType === TarotPoolTokenType.BorrowableA) {
        return [token0BorrowableContract, token0Contract, poolContract]
      }

      if (poolTokenType === TarotPoolTokenType.BorrowableB) {
        return [token1BorrowableContract, token1Contract, poolContract]
      }

      return [collateralContract, lpTokenContract, poolContract]
    },

    async getExchangeRate(poolTokenType: TarotPoolTokenType): Promise<BigNumber> {
      let ret = BigNumber.from(0)
      if (poolTokenType === TarotPoolTokenType.BorrowableA) {
        ret = await token0BorrowableContract.exchangeRateLast()
      } else if (poolTokenType === TarotPoolTokenType.BorrowableB) {
        ret = await token1BorrowableContract.exchangeRateLast()
      } else if (poolTokenType === TarotPoolTokenType.Collateral) {
        let exchangeRate = TEN_18 // BigNumber.from(pool.collateralExchangeRate)
        if (config.isTarotVault) {
          const vTarotExchangeRate = await poolContract.exchangeRate()
          exchangeRate = exchangeRate.mul(vTarotExchangeRate).div(TEN_18)
        }
        ret = exchangeRate
      }
      return ret
    },

    async getDeposited(poolTokenType: TarotPoolTokenType): Promise<BigAmount> {
      const [[poolToken], exchangeRate] = await Promise.all([this.getContracts(poolTokenType), this.getExchangeRate(poolTokenType)])
      const balance = await poolToken.balanceOf(walletAddress)
      let decimals = 18
      if (poolTokenType === TarotPoolTokenType.BorrowableA) {
        decimals = config.token0.decimals
      } else if (poolTokenType === TarotPoolTokenType.BorrowableB) {
        decimals = config.token1.decimals
      }
      return {
        amount: balance.mul(exchangeRate).div(TEN_18),
        decimals: BigNumber.from(decimals)
      }
    },

    async getBorrowed(poolTokenType: TarotPoolTokenType): Promise<BigAmount> {
      const contracts = await this.getContracts(poolTokenType)
      const borrowable = contracts[0] as TarotBorrowable
      const [balance, accrualTimestamp, borrowRate] = await Promise.all([
        borrowable.borrowBalance(walletAddress),
        borrowable.accrualTimestamp(),
        borrowable.borrowRate()
      ])

      let decimals = 18
      if (poolTokenType === TarotPoolTokenType.BorrowableA) {
        decimals = config.token0.decimals
      } else if (poolTokenType === TarotPoolTokenType.BorrowableB) {
        decimals = config.token1.decimals
      }
      return {
        amount: balance.add(
          balance
            .mul(60000 + Date.now() - accrualTimestamp * 1000)
            .mul(borrowRate)
            .div(TEN_18)
            .div(1000)
        ),
        decimals: BigNumber.from(decimals)
      }
    },

    parseNumber(bigAmount: BigAmount | undefined): number {
      if (!bigAmount) {
        return 0
      }
      return parseFloat(formatUnits(bigAmount.amount, bigAmount.decimals))
    },

    async getValuesFromPrice(
      changes: typeof this.NO_CHANGES,
      priceA: number,
      priceB: number
    ): Promise<{ valueCollateral: number; valueA: number; valueB: number }> {
      const [valueCollateralPart, amountAPart, amountBPart] = await Promise.all([
        this.getDeposited(TarotPoolTokenType.Collateral),
        this.getBorrowed(TarotPoolTokenType.BorrowableA),
        this.getBorrowed(TarotPoolTokenType.BorrowableB)
      ])
      const valueCollateral = this.parseNumber(valueCollateralPart) + changes.changeCollateral
      const amountA = this.parseNumber(amountAPart) + changes.changeBorrowedA
      const amountB = this.parseNumber(amountBPart) + changes.changeBorrowedB
      const valueA = amountA * priceA
      const valueB = amountB * priceB
      return {
        valueCollateral: valueCollateral > 0 ? valueCollateral : 0,
        valueA: valueA > 0 ? valueA : 0,
        valueB: valueB > 0 ? valueB : 0
      }
    },

    async getMarketValues(changes: typeof this.NO_CHANGES): Promise<{ valueCollateral: number; valueA: number; valueB: number }> {
      const [priceA, priceB] = await this.getMarketPriceDenomLP()
      return await this.getValuesFromPrice(this.NO_CHANGES, priceA, priceB)
    },

    async getMaxDeleverage(): Promise<number> {
      if (config.isStable) {
        const [[reserve0, reserve1], { valueCollateral, valueA, valueB }] = await Promise.all([this.getReserves(), this.getMarketValues(this.NO_CHANGES)])
        const x2 = reserve0 * reserve0
        const y2 = reserve1 * reserve1
        const f = (3 * x2 + y2) / (x2 + 3 * y2)
        const minRepayA = (valueCollateral * f) / (1 + f) / Math.sqrt(SLIPPAGE_FACTOR)
        const minRepayB = valueCollateral / (1 + f) / Math.sqrt(SLIPPAGE_FACTOR)
        if (minRepayA >= valueA && minRepayB >= valueB) {
          const deposited = await this.getDeposited(TarotPoolTokenType.Collateral)
          return this.parseNumber(deposited)
        }
        if (valueCollateral / Math.sqrt(SLIPPAGE_FACTOR) < valueA + valueB) {
          return 0
        }
        if (minRepayA >= valueA) {
          return valueA * (1 + 1 / f) * Math.sqrt(SLIPPAGE_FACTOR)
        } else {
          return valueB * (1 + f) * Math.sqrt(SLIPPAGE_FACTOR)
        }
      }
      const { valueCollateral, valueA, valueB } = await this.getMarketValues(this.NO_CHANGES)
      const minRepayPerSide = valueCollateral / 2 / Math.sqrt(SLIPPAGE_FACTOR)
      if (minRepayPerSide >= valueA && minRepayPerSide >= valueB) {
        const deposited = await this.getDeposited(TarotPoolTokenType.Collateral)
        return this.parseNumber(deposited)
      }
      if (minRepayPerSide * 2 < valueA + valueB) {
        return 0
      }
      return Math.min(valueA, valueB) * 2 * Math.sqrt(SLIPPAGE_FACTOR)
    },

    async getDeleverageAmounts(
      changeCollateralValue: number
    ): Promise<{ bAmountA: number; bAmountB: number; cAmount: number; bAmountAMin: number; bAmountBMin: number }> {
      const [[x, y], [priceA, priceB]] = await Promise.all([this.getReserves(), this.getMarketPriceDenomLP()])
      const lpStable = await lpTokenContract.stable()
      const x2 = x * x
      const y2 = y * y
      const f = lpStable ? (3 * x2 + y2) / (x2 + 3 * y2) : 1
      const valueA = (changeCollateralValue * f) / (1 + f)
      const valueB = changeCollateralValue / (1 + f)
      const bAmountA = priceA > 0 ? valueA / priceA : 0
      const bAmountB = priceB > 0 ? valueB / priceB : 0
      return {
        bAmountA: bAmountA,
        bAmountB: bAmountB,
        cAmount: changeCollateralValue,
        bAmountAMin: bAmountA / Math.sqrt(SLIPPAGE_FACTOR),
        bAmountBMin: bAmountB / Math.sqrt(SLIPPAGE_FACTOR)
      }
    },

    formatToDecimals(n: number, decimals = 2): string {
      if (n === Infinity) return 'Infinity'
      return (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals)
    },
    decimalToBalance(d: string | number, decimals = 18): BigNumber {
      const n = parseFloat(d.toString())
      const s = this.formatToDecimals(Math.max(n, 0), decimals)
      return parseUnits(s, decimals)
    }
  }
}
