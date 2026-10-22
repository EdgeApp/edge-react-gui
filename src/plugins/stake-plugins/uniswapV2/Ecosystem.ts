import { ethers } from 'ethers'

import { getStakingProvider } from '../util/rpcProviders'

type ContractInfoMap = Record<string, ContractInfo>
interface ContractInfo {
  abi: ethers.ContractInterface
  address: string
}

export interface Ecosystem {
  getContractInfo: (key: string) => ContractInfo
  makeContract: (key: string) => ethers.Contract
  multipass: (
    fn: (provider: ethers.providers.BaseProvider) => Promise<any>
  ) => Promise<any>
  makeSigner: (
    seed: string,
    provider?: ethers.providers.BaseProvider
  ) => ethers.Wallet
}

export const makeEcosystem = (
  contractInfoMap: ContractInfoMap,
  pluginId: string
): Ecosystem => {
  // Created on first use, so a chain whose policies never load opens no
  // connections:
  const getProvider = (): ethers.providers.BaseProvider =>
    getStakingProvider(pluginId)

  const getContractInfo = (key: string): ContractInfo => {
    const contractInfo = contractInfoMap[key]
    if (contractInfo == null)
      throw new Error(`Could not find contract info for ${String(key)}`)
    return contractInfo
  }

  const makeContract = (key: string): ethers.Contract => {
    const contractInfo = getContractInfo(key)
    const { abi, address } = contractInfo
    return new ethers.Contract(address, abi, getProvider())
  }

  // The shared provider already moves to another node when one fails:
  const multipass = async (
    fn: (provider: ethers.providers.BaseProvider) => Promise<any>
  ): Promise<any> => await fn(getProvider())

  const makeSigner = (
    seed: string,
    provider?: ethers.providers.BaseProvider
  ): ethers.Wallet => new ethers.Wallet(seed, provider ?? getProvider())

  return {
    getContractInfo,
    makeContract,
    multipass,
    makeSigner
  }
}
