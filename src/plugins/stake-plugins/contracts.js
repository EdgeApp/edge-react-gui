// @flow

import { ethers } from 'ethers'

import ENV from '../../../env.json'
import ANYSWAP_V5_ERC20_ABI from './abi/ANYSWAP_V5_ERC20_ABI.json'
import MASONRY_ABI from './abi/MASONRY_ABI.json'
import TOMB_TREASURY_ABI from './abi/TOMB_TREASURY_ABI.json'
import TSHARE_REWARD_POOL_ABI from './abi/TSHARE_REWARD_POOL_ABI.json'
import UNISWAP_V2_PAIR from './abi/UNISWAP_V2_PAIR.json'
import UNISWAP_V2_ROUTER_02 from './abi/UNISWAP_V2_ROUTER_02.json'
import WRAPPED_FTM_ABI from './abi/WRAPPED_FTM_ABI.json'

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
  CEMETERY_V2_REWARD_POOL: { abi: TSHARE_REWARD_POOL_ABI, address: '0x1F832dfBA15346D25438Cf7Ac683b013Ed03E32f' },
  SPOOKY_SWAP_ROUTER: { abi: UNISWAP_V2_ROUTER_02, address: '0xF491e7B69E4244ad4002BC14e878a34207E38c29' },
  TOMB_MASONRY: { abi: MASONRY_ABI, address: '0x8764de60236c5843d9faeb1b638fbce962773b67' },
  TOMB_SWAP_ROUTER: { abi: UNISWAP_V2_ROUTER_02, address: '0x6d0176c5ea1e44b08d3dd001b0784ce42f47a3a7' },
  TOMB_TREASURY: { abi: TOMB_TREASURY_ABI, address: '0xF50c6dAAAEC271B56FCddFBC38F0b56cA45E6f0d' },
  TSHARE_REWARD_POOL: { abi: TSHARE_REWARD_POOL_ABI, address: '0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43' },

  // Tokens
  AVAX: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x511d35c52a3c244e7b8bd92c0c297755fbd89212' },
  BNB: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xd67de0e0a0fd7b15dc8348bb9be742f3c5850454' },
  BTC: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x321162cd933e2be498cd2267a90534a804051b11' },
  CRV: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x1e4f97b9f9f913c46f1632781732927b9019c68b' },
  DAI: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e' },
  ETH: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x74b23882a30290451a17c44f4f05243b6b58c76d' },
  FTM: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83' },
  FUSDT: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x049d68029688eabf473097a2fc38ef61633a3c7a' },
  LIF3: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xbf60e7414ef09026733c1e7de72e7393888c64da' },
  LINK: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8' },
  LSHARE: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xcbe0ca46399af916784cadf5bcc3aed2052d6c45' },
  MAI: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xfB98B335551a418cD0737375a2ea0ded62Ea213b' },
  MIM: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x82f0b8b456c1a451378467398982d4834b6829c1' },
  TBOND: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x24248cd1747348bdc971a5395f4b3cd7fee94ea0' },
  TOMB: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7' },
  TSHARE: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37' },
  USDC: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75' },
  WFTM: { abi: WRAPPED_FTM_ABI, address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83' },
  ZOO: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x09e145a1d53c0045f41aeef25d8ff982ae74dd56' },

  // Liquidity Pair Tokens
  // TombSwap LPs
  TOMBSWAP_BTC_ETH_LP: { abi: UNISWAP_V2_PAIR, address: '0x3f468804d133894a73b54cfc07D5886E5195255f' },
  TOMBSWAP_BTC_TSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0xa1f4a9ee0d06115376dFf357D34C3F5eb4107398' },
  TOMBSWAP_CRV_FTM_LP: { abi: UNISWAP_V2_PAIR, address: '0xFF17e19feEaF403e8eD9d79a5b78B8F4ded38df3' },
  TOMBSWAP_FTM_AVAX_LP: { abi: UNISWAP_V2_PAIR, address: '0xC753D5AA76F90b7057Cc2B6766fE67FAf68BF6e3' },
  TOMBSWAP_FTM_BNB_LP: { abi: UNISWAP_V2_PAIR, address: '0xB5F1b98693c4894880dD90c1D3E7A517B9c16aE3' },
  TOMBSWAP_FTM_BTC_LP: { abi: UNISWAP_V2_PAIR, address: '0x5063C79e377332FB98CB6C8DB414d752DC7C478E' },
  TOMBSWAP_FTM_DAI_LP: { abi: UNISWAP_V2_PAIR, address: '0xB89486a030075B42d589008Da7877dd783Af968F' },
  TOMBSWAP_FTM_ETH_LP: { abi: UNISWAP_V2_PAIR, address: '0x8E49C8fBF6128356019D8A7d34E9b92f03bc2803' },
  TOMBSWAP_FTM_LIF3_LP: { abi: UNISWAP_V2_PAIR, address: '0xd62CAcDb69000feD31bb348e9c0e073BB8AD7cAF' },
  TOMBSWAP_FTM_LINK_LP: { abi: UNISWAP_V2_PAIR, address: '0x51e1b9B1ec411A2258f674c26A0a0Ac78CD81478' },
  TOMBSWAP_FTM_LSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0x06623FBa85E66CB93e7802cDFea8E5F1d70c38A9' },
  TOMBSWAP_FTM_MIM_LP: { abi: UNISWAP_V2_PAIR, address: '0xa7c86Fc1B87830b8aBFA623571405E03560a8326' },
  TOMBSWAP_FTM_TOMB_LP: { abi: UNISWAP_V2_PAIR, address: '0xfca12A13ac324C09e9F43B5e5cfC9262f3Ab3223' },
  TOMBSWAP_FUSDT_FTM_LP: { abi: UNISWAP_V2_PAIR, address: '0x681d32C8b374c2Dd83064775dBB48EA97db2c506' },
  TOMBSWAP_LIF3_LSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0x82045cbaF366a30f8888628Fb94628806c700dA2' },
  TOMBSWAP_TBOND_TOMB_LP: { abi: UNISWAP_V2_PAIR, address: '0x2B2703716D3234b787C42E89950653688C012dEa' },
  TOMBSWAP_TOMB_LIF3_LP: { abi: UNISWAP_V2_PAIR, address: '0xcC3d9921302dBBc72171EED1b10FD45F9e83AD8c' },
  TOMBSWAP_TOMB_LSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0x355E1045dAaF4877927322803ca0ccC7df3721d5' },
  TOMBSWAP_TOMB_USDC_LP: { abi: UNISWAP_V2_PAIR, address: '0xAA9BE68D990d5e56870B2E0544f96ffb0B1dA8F7' },
  TOMBSWAP_TSHARE_ETH_LP: { abi: UNISWAP_V2_PAIR, address: '0xd702D7495b010936EBc53a1efeE42D97996Ca5Ee' },
  TOMBSWAP_TSHARE_LSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0x9fc1CFb778864D319EBe35aFd475f869ED8E34A9' },
  TOMBSWAP_USDC_FTM_LP: { abi: UNISWAP_V2_PAIR, address: '0x8C853ce1561A2c2cD2E857670e3cCd04BA4cB27b' },
  TOMBSWAP_USDC_FUSDT_LP: { abi: UNISWAP_V2_PAIR, address: '0x3486011E2E18ccf4558c4C84d5cbBcCFdbF16c03' },
  TOMBSWAP_USDC_LIF3_LP: { abi: UNISWAP_V2_PAIR, address: '0x502EeeB06c2E01fD151cFc6624f0b98420bd1291' },
  TOMBSWAP_USDC_LSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0x0621d9C22fad25bF5B88735dEfB419fa60F118f7' },
  TOMBSWAP_USDC_MIM_LP: { abi: UNISWAP_V2_PAIR, address: '0xd840aF68b35469eC3478c9b0CBCDdc6dc80Dd98C' },
  TOMBSWAP_USDC_TSHARE_LP: { abi: UNISWAP_V2_PAIR, address: '0xDEc1259188E6c5273AcD1e84d5B4b58897CA013e' },
  TOMBSWAP_ZOO_TOMB_LP: { abi: UNISWAP_V2_PAIR, address: '0x67019E7B4A233cc2E875e5c713042333d879aaCE' },

  // SpookySwap LPs
  TOMB_WFTM_LP: { abi: UNISWAP_V2_PAIR, address: '0x2A651563C9d3Af67aE0388a5c8F89b867038089e' },
  TSHARE_WFTM_LP: { abi: UNISWAP_V2_PAIR, address: '0x4733bc45eF91cF7CcEcaeeDb794727075fB209F2' }

  // TODO: These tokens and associated LP's will require multi-hop routing to swap or wait for a direct swap route.
  // FUSD: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xad84341756bf337f5a0164515b1f6f993d194e1f' },
  // TREEB: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xc60d7067dfbc6f2caf30523a064f416a5af52963' },
  // TOMBSWAP_USDC_FUSD_LP: { abi: UNISWAP_V2_PAIR, address: '0x38fF5377A42D0A45C829de45801481869087d22C' },
  // TOMBSWAP_TOMB_TREEB_LP: { abi: UNISWAP_V2_PAIR, address: '0x801D17c21D0808Bc00D46E2f081214c9d82F4FbF' },
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
