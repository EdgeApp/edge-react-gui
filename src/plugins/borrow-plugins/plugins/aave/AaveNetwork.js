// @flow

import { BigNumber, ethers } from 'ethers'

import A_TOKEN_ABI from './abi/A_TOKEN_ABI.json'
import LENDING_POOL_ABI from './abi/LENDING_POOL_ABI.json'
import PROTOCOL_DATA_PROVIDER_ABI from './abi/PROTOCOL_DATA_PROVIDER_ABI.json'
import STABLE_DEBT_TOKEN_ABI from './abi/STABLE_DEBT_TOKEN_ABI.json'
import VARIABLE_DEBT_TOKEN_ABI from './abi/VARIABLE_DEBT_TOKEN_ABI.json'

export type AaveNetworkBlueprint = {
  provider: ethers.Provider,

  // Addresses
  contractAddresses: {
    lendingPool: string,
    protocolDataProvider: string
  },
  enabledTokens: { [currencyCode: string]: boolean }
}

export type AaveNetwork = {
  // Contracts
  lendingPool: ethers.Contract,
  protocolDataProvider: ethers.Contract,

  // Helpers
  getAllReservesTokens: () => Promise<Array<{ symbol: string, address: string }>>,
  getReserveTokenAddresses: (address: string) => Promise<{
    aToken: any,
    sToken: any,
    vToken: any
  }>,
  getReserveTokenBalances: (address: string) => Promise<Array<{ address: string, aBalance: BigNumber, vBalance: BigNumber, variableApr: BigNumber }>>,
  getReserveTokenRates: (tokenAddress: string) => Promise<{
    variableApr: number,
    stableApr: number
  }>
}

const RAY = BigNumber.from('10').pow('27')

export const makeAaveNetworkFactory = (blueprint: AaveNetworkBlueprint): AaveNetwork => {
  const { provider, contractAddresses, enabledTokens } = blueprint

  const lendingPool = new ethers.Contract(contractAddresses.lendingPool, LENDING_POOL_ABI, provider)
  const protocolDataProvider = new ethers.Contract(contractAddresses.protocolDataProvider, PROTOCOL_DATA_PROVIDER_ABI, provider)

  const instance: AaveNetwork = {
    lendingPool,
    protocolDataProvider,

    //
    // Helpers
    //

    // TODO: Cache the response for this function
    async getAllReservesTokens() {
      const reserveTokens: Array<[string, string]> = await protocolDataProvider.getAllReservesTokens()
      const out: Array<{ symbol: string, address: string }> = reserveTokens.map(([symbol, address]) => ({ symbol, address }))
      return out.filter(reserveToken => enabledTokens[reserveToken.symbol])
    },

    // TODO: Cache the response for this function
    async getReserveTokenAddresses(address) {
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
        const { aToken, vToken } = await instance.getReserveTokenAddresses(token.address)
        const aBalance = await aToken.balanceOf(address)
        const vBalance = await vToken.balanceOf(address)
        const { variableApr } = await instance.getReserveTokenRates(token.address)

        return { address: token.address, aBalance, vBalance, variableApr }
      })
      const reserveTokenBalances: Array<{ address: string, aBalance: BigNumber, vBalance: BigNumber, variableApr: BigNumber }> = await Promise.all(
        whenReserveTokenBalances
      )
      return reserveTokenBalances
    },

    async getReserveTokenRates(tokenAddress) {
      const [, , , , variableBorrowRate, stableBorrowRate, , , , , ,] = await lendingPool.getReserveData(tokenAddress)

      const variableApr = parseFloat(variableBorrowRate.toString()) / parseFloat(RAY.toString())
      const stableApr = parseFloat(stableBorrowRate.toString()) / parseFloat(RAY.toString())

      return {
        variableApr,
        stableApr
      }
    }
  }
  return instance
}
