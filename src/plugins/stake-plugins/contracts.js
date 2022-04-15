// @flow

import { ethers } from 'ethers'

import ENV from '../../../env.json'
import MASONRY_ABI from './abi/MASONRY_ABI.json'
import TOMB_ABI from './abi/TOMB_ABI.json'
import TOMB_TREASURY_ABI from './abi/TOMB_TREASURY_ABI.json'
import TSHARE_ABI from './abi/TSHARE_ABI.json'
import TSHARE_REWARD_POOL_ABI from './abi/TSHARE_REWARD_POOL_ABI.json'
import UNISWAP_V2_PAIR from './abi/UNISWAP_V2_PAIR.json'
import UNISWAP_V2_ROUTER_02 from './abi/UNISWAP_V2_ROUTER_02.json'

export const rpcProviderUrls = [
  `https://polished-empty-cloud.fantom.quiknode.pro/${ENV.FANTOM_INIT?.quiknodeApiKey ?? ''}/`,
  'https://rpc.ftm.tools'
  // 'https://rpc.fantom.network',
  // 'https://rpc2.fantom.network',
  // 'https://rpc3.fantom.network',
  // 'https://rpcapi.fantom.network',
  // 'https://rpc.ankr.com/fantom'
]
export const providers = rpcProviderUrls.map<ethers.Provider>(url => new ethers.providers.JsonRpcProvider(url))

type ContractInfo = {
  abi: mixed,
  address: string
}
const contractInfoMap: { [key: string]: ContractInfo } = {
  SPOOKY_SWAP_ROUTER: {
    abi: UNISWAP_V2_ROUTER_02,
    address: '0xF491e7B69E4244ad4002BC14e878a34207E38c29'
  },
  TOMB: {
    abi: TOMB_ABI,
    address: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7'
  },
  TOMB_MASONRY: {
    abi: MASONRY_ABI,
    address: '0x8764de60236c5843d9faeb1b638fbce962773b67'
  },
  TOMB_TREASURY: {
    abi: TOMB_TREASURY_ABI,
    address: '0xF50c6dAAAEC271B56FCddFBC38F0b56cA45E6f0d'
  },
  TOMB_WFTM_LP: {
    abi: UNISWAP_V2_PAIR,
    address: '0x2A651563C9d3Af67aE0388a5c8F89b867038089e'
  },
  TSHARE_WFTM_LP: {
    abi: UNISWAP_V2_PAIR,
    address: '0x4733bc45eF91cF7CcEcaeeDb794727075fB209F2'
  },
  TSHARE: {
    abi: TSHARE_ABI,
    address: '0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37'
  },
  TSHARE_REWARD_POOL: {
    abi: TSHARE_REWARD_POOL_ABI,
    address: '0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43'
  }
}

export const getContractInfo = (key: string): ContractInfo => {
  const contractInfo = contractInfoMap[key]
  if (contractInfo == null) throw new Error(`Could not find contract info for ${key}`)
  return contractInfo
}

export const makeContract = (key: string) => {
  const contractInfo = getContractInfo(key)
  const { abi, address } = contractInfo
  return new ethers.Contract(address, abi, providers[0])
}

let lastServerIndex = 0
export const multipass = async (fn: (provider: ethers.Provider) => Promise<any>) => {
  const provider = providers[lastServerIndex % providers.length]
  try {
    return await fn(provider)
  } catch (error) {
    // Move index forward if an error is thrown
    ++lastServerIndex
    throw error
  }
}

export const makeSigner = (seed: string, provider: ethers.Provider = providers[0]) => new ethers.Wallet(seed, provider)
