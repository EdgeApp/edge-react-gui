// @flow

import { ethers } from 'ethers'

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
  }
}

export type AaveNetwork = {
  // Contracts
  lendingPool: ethers.Contract,
  protocolDataProvider: ethers.Contract,

  // Helpers
  getReserveTokensAddresses: (asset: string) => Promise<{
    aToken: any,
    sToken: any,
    vToken: any
  }>,
  getAllReservesTokens: () => Promise<Array<{ symbol: string, address: string }>>
}

export const makeAaveNetworkFactory = (blueprint: AaveNetworkBlueprint): AaveNetwork => {
  const { provider, contractAddresses } = blueprint

  const lendingPool = new ethers.Contract(contractAddresses.lendingPool, LENDING_POOL_ABI, provider)
  const protocolDataProvider = new ethers.Contract(contractAddresses.protocolDataProvider, PROTOCOL_DATA_PROVIDER_ABI, provider)

  return {
    lendingPool,
    protocolDataProvider,

    //
    // Helpers
    //

    // TODO: Cache the response for this function
    async getReserveTokensAddresses(asset) {
      const [aTokenAddress, sTokenAddress, vTokenAddress] = await protocolDataProvider.getReserveTokensAddresses(asset)
      const aToken = new ethers.Contract(aTokenAddress, A_TOKEN_ABI, provider)
      const sToken = new ethers.Contract(sTokenAddress, STABLE_DEBT_TOKEN_ABI, provider)
      const vToken = new ethers.Contract(vTokenAddress, VARIABLE_DEBT_TOKEN_ABI, provider)
      return { aToken, sToken, vToken }
    },

    // TODO: Cache the response for this function
    async getAllReservesTokens() {
      const reserveTokens: Array<[string, string]> = await protocolDataProvider.getAllReservesTokens()
      const out: Array<{ symbol: string, address: string }> = reserveTokens.map(([symbol, address]) => ({ symbol, address }))
      return out
    }
  }
}
