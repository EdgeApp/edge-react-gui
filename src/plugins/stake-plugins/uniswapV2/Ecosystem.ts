import { ethers } from 'ethers'

interface ContractInfoMap {
  [key: string]: ContractInfo
}
interface ContractInfo {
  abi: ethers.ContractInterface
  address: string
}

export const makeEcosystem = (contractInfoMap: ContractInfoMap, rpcProviderUrls: string[]) => {
  const providers = rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url))

  const getContractInfo = (key: string): ContractInfo => {
    const contractInfo = contractInfoMap[key]
    if (contractInfo == null) throw new Error(`Could not find contract info for ${String(key)}`)
    return contractInfo
  }

  const makeContract = (key: string) => {
    const contractInfo = getContractInfo(key)
    const { abi, address } = contractInfo
    return new ethers.Contract(address, abi, providers[0])
  }

  let lastServerIndex = 0
  const multipass = async (fn: (provider: ethers.providers.BaseProvider) => Promise<any>) => {
    const provider = providers[lastServerIndex % providers.length]
    try {
      return await fn(provider)
    } catch (error: any) {
      // Move index forward if an error is thrown
      ++lastServerIndex
      throw error
    }
  }

  const makeSigner = (seed: string, provider: ethers.providers.BaseProvider = providers[0]) => new ethers.Wallet(seed, provider)

  return {
    getContractInfo,
    makeContract,
    multipass,
    makeSigner
  }
}
