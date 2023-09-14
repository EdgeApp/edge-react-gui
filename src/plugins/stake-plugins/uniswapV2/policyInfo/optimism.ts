import { StakeProviderInfo } from '../../types'
import ANYSWAP_V5_ERC20_ABI from '../abi/ANYSWAP_V5_ERC20_ABI.json'
import UNISWAP_V2_PAIR from '../abi/UNISWAP_V2_PAIR.json'
import VELODROME_V2_GAUGE from '../abi/VELODROME_V2_GAUGE.json'
import VELODROME_V2_ROUTER from '../abi/VELODROME_V2_ROUTER.json'
import WRAPPED_ETH_ABI from '../abi/WRAPPED_ETH_ABI.json'
import { makeEcosystem } from '../Ecosystem'
import { makeVelodromeV2StakePolicy } from '../policies/VelodromeV2StakePolicy'
import { StakePolicyInfo } from '../stakePolicy'

// -----------------------------------------------------------------------------
// Contract Info Map
// -----------------------------------------------------------------------------

export const optimismContractInfoMap = {
  ROUTER_VELODROME_V2: { abi: VELODROME_V2_ROUTER, address: '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858' },

  // Tokens
  ETH: { abi: WRAPPED_ETH_ABI, address: '0x4200000000000000000000000000000000000006' },
  DAI: { abi: ANYSWAP_V5_ERC20_ABI, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
  DOLA: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x8aE125E8653821E851F12A49F7765db9a9ce7384' },
  USDC: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' },
  USDT: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
  VELO: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db' },
  OP: { abi: ANYSWAP_V5_ERC20_ABI, address: '0x4200000000000000000000000000000000000042' },
  WETH: { abi: WRAPPED_ETH_ABI, address: '0x4200000000000000000000000000000000000006' },

  // Liquidity Pool Tokens:
  // Stable
  POOL_sAMMV2_ETH_OP: { abi: UNISWAP_V2_PAIR, address: '0x5404c61F5337D5a06522ca686dc388e0Fc50Fd32' },
  POOL_sAMMV2_OP_USDT: { abi: UNISWAP_V2_PAIR, address: '0x4D8b739114309E4dae98362c447099B671d12ecA' },
  POOL_sAMMV2_USDC_DAI: { abi: UNISWAP_V2_PAIR, address: '0x19715771E30c93915A5bbDa134d782b81A820076' },
  POOL_sAMMV2_USDC_USDT: { abi: UNISWAP_V2_PAIR, address: '0x2B47C794c3789f499D8A54Ec12f949EeCCE8bA16' },
  POOL_sAMMV2_WETH_OP: { abi: UNISWAP_V2_PAIR, address: '0x5404c61F5337D5a06522ca686dc388e0Fc50Fd32' },
  // Volatile
  POOL_vAMMV2_ETH_OP: { abi: UNISWAP_V2_PAIR, address: '0xd25711EdfBf747efCE181442Cc1D8F5F8fc8a0D3' },
  POOL_vAMMV2_ETH_USDC: { abi: UNISWAP_V2_PAIR, address: '0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b' },
  POOL_vAMMV2_OP_USDC: { abi: UNISWAP_V2_PAIR, address: '0x0df083de449F75691fc5A36477a6f3284C269108' },
  POOL_vAMMV2_USDC_DOLA: { abi: UNISWAP_V2_PAIR, address: '0x04730579f1468C06530ae3a84B7D5c233f3a130D' },
  POOL_vAMMV2_WETH_OP: { abi: UNISWAP_V2_PAIR, address: '0xd25711EdfBf747efCE181442Cc1D8F5F8fc8a0D3' },
  POOL_vAMMV2_WETH_USDC: { abi: UNISWAP_V2_PAIR, address: '0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b' },

  // Velodrome Gauges (reward pools):
  /*
  Call gauge(_pool address) on Voter V2 (0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C)
  to get a liquidity pool's gauge contract.
  */
  // Stable
  GAUGE_sAMMV2_ETH_OP: { abi: VELODROME_V2_GAUGE, address: '0x5dB64E8050534eE0b41b5295Bf5fcBb402b3CaFA' },
  GAUGE_sAMMV2_OP_USDT: { abi: VELODROME_V2_GAUGE, address: '0x74C97b9aeB2f5b1841Ba99bca6991E8531715E0C' },
  GAUGE_sAMMV2_USDC_DAI: { abi: VELODROME_V2_GAUGE, address: '0x6998089F6bDd9c74C7D8d01b99d7e379ccCcb02D' },
  GAUGE_sAMMV2_USDC_USDT: { abi: VELODROME_V2_GAUGE, address: '0xa2f27d183A4E409c734367712f9344328f8EC98D' },
  GAUGE_sAMMV2_WETH_OP: { abi: VELODROME_V2_GAUGE, address: '0x5dB64E8050534eE0b41b5295Bf5fcBb402b3CaFA' },
  // Volatile
  GAUGE_vAMMV2_ETH_OP: { abi: VELODROME_V2_GAUGE, address: '0xCC53CD0a8EC812D46F0E2c7CC5AADd869b6F0292' },
  GAUGE_vAMMV2_ETH_USDC: { abi: VELODROME_V2_GAUGE, address: '0xE7630c9560C59CCBf5EEd8f33dd0ccA2E67a3981' },
  GAUGE_vAMMV2_OP_USDC: { abi: VELODROME_V2_GAUGE, address: '0x36691b39Ec8fa915204ba1e1A4A3596994515639' },
  GAUGE_vAMMV2_USDC_DOLA: { abi: VELODROME_V2_GAUGE, address: '0x7C07703B1f470b7673bF65aE6d49883AF2cA341e' },
  GAUGE_vAMMV2_WETH_OP: { abi: VELODROME_V2_GAUGE, address: '0xCC53CD0a8EC812D46F0E2c7CC5AADd869b6F0292' },
  GAUGE_vAMMV2_WETH_USDC: { abi: VELODROME_V2_GAUGE, address: '0xE7630c9560C59CCBf5EEd8f33dd0ccA2E67a3981' }
}

// -----------------------------------------------------------------------------
// Ecosystem
// -----------------------------------------------------------------------------

const rpcProviderUrls = ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism']
const eco = makeEcosystem(optimismContractInfoMap, rpcProviderUrls)
export const optimismEcosystem = eco

// -----------------------------------------------------------------------------
// Stake Policy Info
// -----------------------------------------------------------------------------

const velodromeProviderInfo: StakeProviderInfo = {
  displayName: 'Velodrome',
  pluginId: 'optimism',
  stakeProviderId: 'optimism_velodrome'
}

export const optimismPolicyInfo: StakePolicyInfo[] = [
  // Velodrome V2 Stake Policies:
  ...Object.keys(optimismContractInfoMap).reduce((allInfo: StakePolicyInfo[], key) => {
    const info = generateVelodromeV2StakePolicyInfo(key)
    return info == null ? allInfo : [...allInfo, info]
  }, [])
]

/**
 * Stake policy info generator function for Velodrome V2 stable and volatile
 * AMM liquidity pools.
 *
 * Takes a `poolContractKey` string from the `ContractInfoMap` formatted
 * `POOL_<type>_<tokenA>_<tokenB>` and returns `StakePolicyInfo`. The `<type>`
 * should be either `vAMMV2` or `sAMMV2` for volatile or stable pools types.
 *
 * A incorrectly formatted `poolContractKey` will return `null`.
 */
function generateVelodromeV2StakePolicyInfo(poolContractKey: string): StakePolicyInfo | null {
  const [keyType, poolType, tokenA, tokenB] = poolContractKey.split('_')
  if (keyType !== 'POOL') return null
  const isStablePool = poolType[0] === 's'

  return {
    stakePolicyId: `optimism_velodrome_${poolType}_${tokenA}_${tokenB}`,
    stakeProviderInfo: velodromeProviderInfo,
    parentPluginId: 'optimism',
    parentCurrencyCode: 'ETH',
    isStablePool,
    policy: makeVelodromeV2StakePolicy({
      isStablePool,
      lpTokenContract: eco.makeContract(poolContractKey),
      stakingContract: eco.makeContract(`GAUGE_${poolType}_${tokenA}_${tokenB}`),
      swapRouterContract: eco.makeContract(`ROUTER_VELODROME_V2`),
      tokenAContract: eco.makeContract(tokenA),
      tokenBContract: eco.makeContract(tokenB)
    }),
    stakeAssets: [
      { pluginId: 'optimism', currencyCode: tokenA },
      { pluginId: 'optimism', currencyCode: tokenB }
    ],
    rewardAssets: [{ pluginId: 'optimism', currencyCode: 'VELO' }]
  }
}
