import { BigNumber, ethers } from 'ethers'

import A_TOKEN_ABI from './abi/A_TOKEN_ABI.json'
import ERC20_ABI from './abi/ERC20_ABI.json'
import LENDING_POOL_ABI from './abi/LENDING_POOL_ABI.json'
import PARASWAP_ABI from './abi/PARASWAP_ABI.json'
import PROTOCOL_DATA_PROVIDER_ABI from './abi/PROTOCOL_DATA_PROVIDER_ABI.json'
import STABLE_DEBT_TOKEN_ABI from './abi/STABLE_DEBT_TOKEN_ABI.json'
import VARIABLE_DEBT_TOKEN_ABI from './abi/VARIABLE_DEBT_TOKEN_ABI.json'

export interface AaveNetworkBlueprint {
  provider: ethers.providers.Provider

  // Addresses
  contractAddresses: {
    lendingPool: string
    protocolDataProvider: string
    paraSwapRepayAdapter: string
  }
  enabledTokens: { [currencyCode: string]: boolean }
}

export interface AaveNetwork {
  provider: ethers.providers.Provider

  // Contracts
  lendingPool: ethers.Contract
  protocolDataProvider: ethers.Contract
  paraSwapRepayAdapter: ethers.Contract

  // Helpers
  getAllReservesTokens: () => Promise<Array<{ symbol: string; address: string }>>
  getReserveTokenContracts: (address: string) => Promise<{
    aToken: ethers.Contract
    sToken: ethers.Contract
    vToken: ethers.Contract
  }>
  getReserveTokenBalances: (address: string) => Promise<Array<{ address: string; aBalance: BigNumber; vBalance: BigNumber; variableApr: number }>>
  getReserveTokenAprRates: (tokenAddress: string) => Promise<{
    variableApr: number
    stableApr: number
  }>
  makeTokenContract: (tokenAddress: string) => Promise<ethers.Contract>
}

const RAY = BigNumber.from('10').pow('27')

export const makeAaveNetworkFactory = (blueprint: AaveNetworkBlueprint): AaveNetwork => {
  const { provider, contractAddresses, enabledTokens } = blueprint

  const lendingPool = new ethers.Contract(contractAddresses.lendingPool, LENDING_POOL_ABI, provider)
  const protocolDataProvider = new ethers.Contract(contractAddresses.protocolDataProvider, PROTOCOL_DATA_PROVIDER_ABI, provider)
  const paraSwapRepayAdapter = new ethers.Contract(contractAddresses.paraSwapRepayAdapter, PARASWAP_ABI, provider)

  const instance: AaveNetwork = {
    provider,
    lendingPool,
    protocolDataProvider,
    paraSwapRepayAdapter,

    //
    // Helpers
    //

    // TODO: Cache the response for this function
    async getAllReservesTokens() {
      const reserveTokens: Array<[string, string]> = await protocolDataProvider.getAllReservesTokens()
      const out: Array<{ symbol: string; address: string }> = reserveTokens.map(([symbol, address]) => ({ symbol, address }))
      return out.filter(reserveToken => enabledTokens[reserveToken.symbol])
    },

    // TODO: Cache the response for this function
    async getReserveTokenContracts(address) {
      const [aTokenAddress, sTokenAddress, vTokenAddress] = await protocolDataProvider.getReserveTokensAddresses(address)
      const aToken = new ethers.Contract(aTokenAddress, A_TOKEN_ABI, provider)
      const sToken = new ethers.Contract(sTokenAddress, STABLE_DEBT_TOKEN_ABI, provider)
      const vToken = new ethers.Contract(vTokenAddress, VARIABLE_DEBT_TOKEN_ABI, provider)
      return { aToken, sToken, vToken }
    },

    // TODO: Cache the response for this function
    async getReserveTokenBalances(address) {
      const reserveTokens = await instance.getAllReservesTokens()
      const whenReserveTokenBalances = reserveTokens.map(async token => {
        const { aToken, vToken } = await instance.getReserveTokenContracts(token.address)
        const aBalance = await aToken.balanceOf(address)
        const vBalance = await vToken.balanceOf(address)
        const { variableApr } = await instance.getReserveTokenAprRates(token.address)

        return { address: token.address, aBalance, vBalance, variableApr }
      })
      const reserveTokenBalances: Array<{ address: string; aBalance: BigNumber; vBalance: BigNumber; variableApr: number }> = await Promise.all(
        whenReserveTokenBalances
      )
      return reserveTokenBalances
    },

    async getReserveTokenAprRates(tokenAddress) {
      const [, , , , variableBorrowRate, stableBorrowRate, , , , , ,] = await lendingPool.getReserveData(tokenAddress)

      const variableApr = parseFloat(variableBorrowRate.toString()) / parseFloat(RAY.toString())
      const stableApr = parseFloat(stableBorrowRate.toString()) / parseFloat(RAY.toString())

      return {
        variableApr,
        stableApr
      }
    },
    async makeTokenContract(tokenAddress) {
      return new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    }
  }
  return instance
}
