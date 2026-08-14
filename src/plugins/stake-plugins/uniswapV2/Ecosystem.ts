import { ethers } from 'ethers'

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
  // A thunk defers reading URLs that embed API keys. Those keys can arrive from
  // the info server after this module is evaluated, so an eager read would pin
  // the baked-in fallback (see `src/util/keysStore.ts`).
  rpcProviderUrls: string[] | (() => string[])
): Ecosystem => {
  let cachedProviders: ethers.providers.JsonRpcProvider[] | undefined
  const getProviders = (): ethers.providers.JsonRpcProvider[] => {
    if (cachedProviders == null) {
      const urls =
        typeof rpcProviderUrls === 'function'
          ? rpcProviderUrls()
          : rpcProviderUrls
      cachedProviders = urls.map(
        url => new ethers.providers.JsonRpcProvider(url)
      )
    }
    return cachedProviders
  }

  const getContractInfo = (key: string): ContractInfo => {
    const contractInfo = contractInfoMap[key]
    if (contractInfo == null)
      throw new Error(`Could not find contract info for ${String(key)}`)
    return contractInfo
  }

  const makeContract = (key: string): ethers.Contract => {
    const contractInfo = getContractInfo(key)
    const { abi, address } = contractInfo
    return new ethers.Contract(address, abi, getProviders()[0])
  }

  let lastServerIndex = 0
  const multipass = async (
    fn: (provider: ethers.providers.BaseProvider) => Promise<any>
  ): Promise<any> => {
    const providers = getProviders()
    const provider = providers[lastServerIndex % providers.length]
    try {
      return await fn(provider)
    } catch (error: unknown) {
      // Move index forward if an error is thrown
      ++lastServerIndex
      throw error
    }
  }

  const makeSigner = (
    seed: string,
    provider?: ethers.providers.BaseProvider
  ): ethers.Wallet => new ethers.Wallet(seed, provider ?? getProviders()[0])

  return {
    getContractInfo,
    makeContract,
    multipass,
    makeSigner
  }
}
