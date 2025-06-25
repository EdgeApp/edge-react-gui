import { add, div, eq, gt, lt, max, mul, sub, toFixed } from 'biggystring'
import {
  asArray,
  asBoolean,
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import {
  asMaybeInsufficientFundsError,
  EdgeAccount,
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeSpendInfo,
  EdgeTransaction,
  InsufficientFundsError
} from 'edge-core-js'
import * as React from 'react'
import { Linking } from 'react-native'

import { ButtonsModal } from '../../../components/modals/ButtonsModal'
import { Airship } from '../../../components/services/AirshipInstance'
import { lstrings } from '../../../locales/strings'
import { StringMap } from '../../../types/types'
import { asMaybeContractLocation } from '../../../util/cleaners'
import {
  getCurrencyCodeMultiplier,
  getTokenId,
  getWalletTokenId
} from '../../../util/CurrencyInfoHelpers'
import { getHistoricalRate } from '../../../util/exchangeRates'
import {
  cleanMultiFetch,
  fetchInfo,
  fetchWaterfall,
  infoServerData
} from '../../../util/network'
import { assert } from '../../gui/pluginUtils'
import {
  ChangeQuote,
  ChangeQuoteRequest,
  filterStakePolicies,
  PositionAllocation,
  QuoteAllocation,
  QuoteInfo,
  StakeBelowLimitError,
  StakePlugin,
  StakePolicy,
  StakePolicyFilter,
  StakePoolFullError,
  StakePosition,
  StakePositionRequest,
  StakeProviderInfo
} from '../types'
import {
  asInfoServerResponse,
  EdgeGuiPluginOptions,
  InfoServerResponse
} from '../util/internalTypes'
import { getEvmApprovalData, getEvmDepositWithExpiryData } from './defiUtils'

const EXCHANGE_INFO_UPDATE_FREQ_MS = 10 * 60 * 1000 // 2 min
const INBOUND_ADDRESSES_UPDATE_FREQ_MS = 10 * 60 * 1000 // 2 min
const MIDGARD_SERVERS_DEFAULT = [
  'https://midgard.ninerealms.com',
  'https://midgard.thorchain.info'
]
const THORNODE_SERVERS_DEFAULT = ['https://thornode.ninerealms.com']
const EVM_WITHDRAWAL_MIN_AMOUNT = '1000000000000'

// When withdrawing from a vault, this represents a withdrawal of 100% of the staked amount.
// Transactions send minAmount + basis points from 0 - TC_SAVERS_WITHDRAWAL_SCALE_UNITS to
// communicate what % to withdraw. ie. Withdraw 75% of staked amount on LTC sends minAmount + basis points
// to the pool address. (10000 + 7500 sats)
const TC_SAVERS_WITHDRAWAL_SCALE_UNITS = '10000'
const DIVIDE_PRECISION = 18

// Thorchain max units per 1 unit of any supported currency
const THOR_LIMIT_UNITS = '100000000'
const EVM_SEND_GAS = '80000'

interface PolicyCurrencyInfo {
  type: 'utxo' | 'evm'
  minAmount: string
}

const asInitOptions = asObject({
  ninerealmsClientId: asOptional(asString, ''),
  affiliateFeeBasis: asOptional(asString, '50'),
  thorname: asOptional(asString, 'ej')
})

const asInboundAddresses = asArray(
  asObject({
    address: asString,
    chain: asString,
    outbound_fee: asString,
    router: asOptional(asString),
    synth_mint_paused: asOptional(asBoolean),
    halted: asBoolean
  })
)

const asThorchainExchangeInfo = asObject({
  swap: asObject({
    plugins: asObject({
      thorchain: asObject({
        midgardServers: asArray(asString),
        thornodeServers: asOptional(asArray(asString)),
        nineRealmsServers: asOptional(asArray(asString)),
        thorSwapServers: asOptional(asArray(asString))
      })
    })
  })
})

const asSaver = asObject({
  asset: asString,
  asset_address: asString,
  last_add_height: asOptional(asNumber),
  units: asString,
  asset_deposit_value: asString
})

const asSavers = asArray(asSaver)

const asPool = asObject({
  asset: asString,
  status: asString,
  assetPrice: asString,
  assetPriceUSD: asString,
  assetDepth: asString,
  saversDepth: asString,
  saversUnits: asString,
  runeDepth: asString
})

const asQuoteDeposit = asEither(
  asObject({
    expected_amount_out: asString,
    inbound_address: asString,
    memo: asString,
    expiry: asNumber
  }),
  asObject({
    error: asString
  })
)

const tcChainCodePluginIdMap: StringMap = {
  BTC: 'bitcoin',
  LTC: 'litecoin'
}

const DUST_THRESHOLDS: StringMap = {
  AVAX: '0',
  BTC: '10000',
  BCH: '10000',
  BSC: '0',
  DOGE: '100000000',
  ETH: '0',
  LTC: '10000'
}

const CLAIMING_DUST_THRESHOLDS: StringMap = {
  AVAX: '10000000000',
  BTC: '10000',
  BCH: '10000',
  BSC: '10000000000',
  DOGE: '100000000',
  ETH: '10000000000',
  LTC: '10000'
}

const asThorNodePool = asObject({
  asset: asString, // "AVAX.AVAX",
  // short_code: asString, // "a",
  // status: asString, // "Available",
  // pending_inbound_asset: asString, // "600000000",
  // pending_inbound_rune: asString, // "0",
  // balance_asset: asString, // "5605433676415",
  // balance_rune: asString, // "35388343579663",
  // pool_units: asString, // "27673425589789",
  // LP_units: asString, // "23256888219750",
  // synth_units: asString, // "4416537370039",
  // synth_supply: asString, // "1789197165117",
  savers_depth: asString // "1731265656406",
  // savers_units: asString, // "1632808946580",
  // synth_mint_paused: asBoolean, // false,
  // synth_supply_remaining: asString, // "4937323246581",
  // loan_collateral: asString, //  "0",
  // loan_cr: asString, // "20000",
  // derived_depth_bps: asString // "9110"
})
const asThorNodePools = asArray(asThorNodePool)

// TCY STUFF
const asTcyClaim = asObject({
  tcy_claimer: asArray(
    asObject({
      asset: asString, // 'ETH.ETH'
      l1_address: asString, // '0x5166ef11e5df6d4ca213778fff4756937e469663'
      amount: asString // '10000000000000'
    })
  )
})

type Saver = ReturnType<typeof asSaver>
type Pool = ReturnType<typeof asPool>
type ExchangeInfo = ReturnType<typeof asThorchainExchangeInfo>
type InboundAddresses = ReturnType<typeof asInboundAddresses>

const utxoInfo: PolicyCurrencyInfo = {
  type: 'utxo',
  minAmount: '10000'
}

const evmInfo: PolicyCurrencyInfo = {
  type: 'evm',
  minAmount: '0'
}

const policyCurrencyInfos: { [pluginId: string]: PolicyCurrencyInfo } = {
  avalanche: evmInfo,
  binancesmartchain: evmInfo,
  bitcoin: utxoInfo,
  bitcoincash: utxoInfo,
  dogecoin: { ...utxoInfo, minAmount: '100000000' },
  ethereum: evmInfo,
  litecoin: utxoInfo
}

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Thorchain Savers (Bech32)',
  pluginId: 'thorchain-bech32',
  stakeProviderId: 'tcsavers-bech32'
}

const policyDefault = {
  apy: 0,
  stakeProviderInfo,
  disableMaxStake: true,
  hideClaimAction: false,
  hideUnstakeAndClaimAction: true,
  stakeWarning: null,
  unstakeWarning: null,
  claimWarning: null
}

const policies: StakePolicy[] = []
let policiesInitialized = false
let initializingPolicies = false

const MAINNET_CODE_TRANSCRIPTION: { [cc: string]: string } = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  binancechain: 'BNB',
  binancesmartchain: 'BSC',
  litecoin: 'LTC',
  ethereum: 'ETH',
  dogecoin: 'DOGE',
  avalanche: 'AVAX',
  thorchain: 'THOR'
}

let exchangeInfo: ExchangeInfo | undefined
let exchangeInfoLastUpdate: number = 0
let inboundAddresses: InboundAddresses | undefined

let midgardServers: string[] = MIDGARD_SERVERS_DEFAULT
let thornodeServers: string[] = THORNODE_SERVERS_DEFAULT

let inboundAddressesLastUpdate: number = 0

// Track which addresses have claimed TCY during the current session. This
// prevents the claim button from being available while the thornode updates its state
const claimedTcyHack = new Set<string>()

export const makeTcSaversPluginSegwit = async (
  pluginId: string,
  opts: EdgeGuiPluginOptions
): Promise<StakePlugin | undefined> => {
  if (Object.values(tcChainCodePluginIdMap).find(p => p === pluginId) == null) {
    return
  }
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)

  if (!policiesInitialized && !initializingPolicies) {
    try {
      initializingPolicies = true
      const poolsResponse = await fetchWaterfall(
        thornodeServers,
        `thorchain/pools`,
        { headers: { 'x-client-id': ninerealmsClientId } }
      )

      if (!poolsResponse.ok) {
        const responseText = await poolsResponse.text()
        throw new Error(
          `Thorchain could not fetch thornode pools: ${responseText}`
        )
      }
      const poolsJson = await poolsResponse.json()
      const pools = asThorNodePools(poolsJson)
      pools.forEach(pool => {
        if (gt(pool.savers_depth, '0')) {
          const edgeAsset = tcAssetToEdge(pool.asset)
          if (edgeAsset == null) return
          const { pluginId, currencyCode } = edgeAsset
          const lowerCc = currencyCode.toLowerCase()

          policies.push({
            ...policyDefault,
            stakePolicyId: `tcsavers/${pluginId}:${lowerCc}=${pluginId}:${lowerCc}-bech32`,
            rewardAssets: [{ pluginId: 'thorchainrune', currencyCode: 'TCY' }],
            stakeAssets: [{ pluginId, currencyCode }],
            deprecated: true
          })
        }
      })
      policiesInitialized = true
    } catch (e) {
      console.log('Error initializing Thorchain Savers policies', String(e))
    } finally {
      initializingPolicies = false
    }
  }

  try {
    const infoServerResponse = asInfoServerResponse(
      infoServerData.rollup?.apyValues
    )
    updatePolicyApys(infoServerResponse)
  } catch (err: any) {
    const msg = `Parsing Fetch APY failed`
    console.warn(msg)
  }

  const instance: StakePlugin = {
    getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
      return filterStakePolicies(policies, filter)
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, wallet } = request
      const policy = getPolicyFromId(stakePolicyId)
      const { pluginId } = policy.stakeAssets[0]

      if (pluginId !== wallet.currencyInfo.pluginId) {
        throw new Error('pluginId mismatch between request and policy')
      }

      switch (action) {
        case 'stake':
          // return await stakeRequest(opts, request)
          await showDisabledModal()
          throw new Error(lstrings.stake_tc_unavailable)

        case 'unstake':
        case 'claim': {
          return await claimRequest(opts, request)
        }
        case 'unstakeExact':
          // return await unstakeRequest(opts, request)
          await showDisabledModal()
          throw new Error(lstrings.stake_tc_unavailable)
      }
    },
    async fetchStakePosition(
      request: StakePositionRequest
    ): Promise<StakePosition> {
      await updateInboundAddresses(opts)
      return await getStakePosition(opts, request)
    }
  }
  return instance
}

const getStakePosition = async (
  opts: EdgeGuiPluginOptions,
  request: StakePositionRequest
): Promise<StakePosition> => {
  const { stakePolicyId, wallet, account } = request
  const policy = getPolicyFromId(stakePolicyId)
  const { currencyCode } = policy.stakeAssets[0]
  const { primaryAddress } = await getPrimaryAddress(
    account,
    wallet,
    currencyCode
  )

  const asset = edgeToTcAsset(wallet.currencyConfig, currencyCode)
  const [pool, saver] = await Promise.all([
    fetchPool(opts, asset),
    fetchSaver(opts, asset, primaryAddress)
  ])

  const claimableTcy = await fetchClaimableTcy(opts, primaryAddress)

  // Return an empty position if:
  // - There's no TCY to claim
  // - TCY has already been claimed in this session
  // - There's an issue getting the actual position

  if (
    claimableTcy === '0' ||
    claimedTcyHack.has(primaryAddress) ||
    saver == null ||
    pool == null
  ) {
    return {
      allocations: [
        {
          pluginId: wallet.currencyInfo.pluginId,
          currencyCode,
          allocationType: 'staked',
          nativeAmount: '0'
        }
      ],
      canStake: pool != null,
      canUnstake: false,
      canUnstakeAndClaim: false,
      canClaim: false
    }
  }

  const position = saverToPosition(
    wallet.currencyConfig,
    currencyCode,
    saver,
    pool
  )

  // TCY has to be the first earned position in order to render correctly in the StakeModifyScene since that scene only looks at the first one
  position.allocations.unshift({
    pluginId: 'thorchainrune',
    currencyCode: 'TCY',
    allocationType: 'earned',
    nativeAmount: claimableTcy
  })
  position.canStake = false
  position.canUnstake = false
  position.canUnstakeAndClaim = false
  position.canClaim = true

  return position
}

async function fetchPool(
  opts: EdgeGuiPluginOptions,
  asset: string
): Promise<Pool | undefined> {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const response = await fetchWaterfall(midgardServers, `v2/pool/${asset}`, {
    headers: { 'x-client-id': ninerealmsClientId }
  })

  if (response.status === 404) return undefined
  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(
      `Thorchain could not fetch /v2/pool/${asset}: ${responseText}`
    )
  }
  const poolsJson = await response.json()
  return asPool(poolsJson)
}

async function fetchSaver(
  opts: EdgeGuiPluginOptions,
  asset: string,
  address: string
): Promise<Saver | undefined> {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const response = await fetchWaterfall(
    thornodeServers,
    `thorchain/pool/${asset}/saver/${address}`,
    {
      headers: { 'x-client-id': ninerealmsClientId }
    }
  )

  if (response.status === 404) return
  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Thorchain could not fetch /pool/saver/: ${responseText}`)
  }
  const saversJson = await response.json()
  return asSaver(saversJson)
}

async function fetchSavers(
  opts: EdgeGuiPluginOptions,
  asset: string
): Promise<Saver[]> {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const response = await fetchWaterfall(
    thornodeServers,
    `thorchain/pool/${asset}/savers`,
    {
      headers: { 'x-client-id': ninerealmsClientId }
    }
  )

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Thorchain could not fetch /pool/savers: ${responseText}`)
  }
  const saversJson = await response.json()
  return asSavers(saversJson)
}

function saverToPosition(
  currencyConfig: EdgeCurrencyConfig,
  currencyCode: string,
  saver: Saver,
  pool: Pool
): StakePosition {
  const pluginId = currencyConfig.currencyInfo.pluginId

  const multiplier = getCurrencyCodeMultiplier(currencyConfig, currencyCode)
  function thorToNative(amount: string): string {
    return toFixed(
      mul(div(amount, THOR_LIMIT_UNITS, DIVIDE_PRECISION), multiplier),
      0,
      0
    )
  }

  const { units, asset_deposit_value: assetDepositValue } = saver
  const stakedAmount = thorToNative(assetDepositValue)
  const canUnstake = gt(stakedAmount, '0')

  const { saversDepth, saversUnits } = pool
  const redeemableValue = div(
    mul(units, saversDepth),
    saversUnits,
    DIVIDE_PRECISION
  )
  const earnedThorAmount = max(sub(redeemableValue, assetDepositValue), '0')
  const earnedAmount = thorToNative(earnedThorAmount)

  return {
    allocations: [
      {
        pluginId,
        currencyCode,
        allocationType: 'staked',
        nativeAmount: stakedAmount
      },
      {
        pluginId,
        currencyCode,
        allocationType: 'earned',
        nativeAmount: earnedAmount
      }
    ],
    canStake: true,
    canUnstake,
    canUnstakeAndClaim: false,
    canClaim: canUnstake
  }
}

async function fetchClaimableTcy(
  opts: EdgeGuiPluginOptions,
  address: string
): Promise<string> {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)

  const response = await fetchWaterfall(
    thornodeServers,
    `thorchain/tcy_claimer/${address}`,
    {
      headers: { 'x-client-id': ninerealmsClientId }
    }
  )

  if (!response.ok) {
    const text = await response.text()
    if (text.includes("doesn't have any tcy to claim")) {
      return '0'
    }
    throw new Error(text)
  }

  const raw = await response.json()
  const json = asTcyClaim(raw)

  return json.tcy_claimer[0].amount
}

const updatePolicyApys = (infoServerResponse: InfoServerResponse) => {
  policies.forEach(policy => {
    const apy = infoServerResponse.policies[policy.stakePolicyId]
    if (apy != null) {
      policy.apy = apy
    }
  })
}

const getPolicyFromId = (policyId: string): StakePolicy => {
  const policy = policies.find(policy => policy.stakePolicyId === policyId)
  if (policy == null) throw new Error(`Cannot find policy ${policyId}`)
  return policy
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stakeRequest = async (
  opts: EdgeGuiPluginOptions,
  request: ChangeQuoteRequest
): Promise<ChangeQuote> => {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)

  const { wallet, nativeAmount, currencyCode, stakePolicyId, account } = request
  const multiplier = getCurrencyCodeMultiplier(
    wallet.currencyConfig,
    currencyCode
  )
  const { pluginId } = wallet.currencyInfo

  const tokenId = getWalletTokenId(wallet, currencyCode)
  const isToken = tokenId != null
  const isEvm = EVM_PLUGINIDS[pluginId]

  const walletBalance = wallet.balanceMap.get(tokenId) ?? '0'
  const exchangeAmount = div(nativeAmount, multiplier, multiplier.length)
  const thorAmount = toFixed(mul(exchangeAmount, THOR_LIMIT_UNITS), 0, 0)
  const parentCurrencyCode = wallet.currencyInfo.currencyCode
  let parentToTokenRate: number = 1
  if (currencyCode !== parentCurrencyCode) {
    parentToTokenRate = await getHistoricalRate(
      `${parentCurrencyCode}_${currencyCode}`,
      new Date().toISOString()
    )
  }
  const parentMultiplier = getCurrencyCodeMultiplier(
    wallet.currencyConfig,
    parentCurrencyCode
  )

  if (lt(walletBalance, nativeAmount)) {
    throw new InsufficientFundsError({ tokenId })
  }

  if (lt(nativeAmount, DUST_THRESHOLDS[currencyCode])) {
    throw new StakeBelowLimitError(request, currencyCode)
  }

  await updateInboundAddresses(opts)

  const { primaryAddress, parentBalance, addressBalance } =
    await getPrimaryAddress(account, wallet, currencyCode)

  const asset = edgeToTcAsset(wallet.currencyConfig, currencyCode)

  const path = `/thorchain/quote/saver/deposit?asset=${asset}&address=${primaryAddress}&amount=${thorAmount}`
  const quoteDeposit = await cleanMultiFetch(
    asQuoteDeposit,
    thornodeServers,
    path,
    { headers: { 'x-client-id': ninerealmsClientId } }
  )
  if ('error' in quoteDeposit) {
    const { error } = quoteDeposit
    if (error.includes('not enough fee')) {
      throw new StakeBelowLimitError(request, currencyCode)
    }
    if (error.includes('synth supply over target')) {
      throw new StakePoolFullError(request, currencyCode)
    }
    throw new Error(error)
  }

  const {
    inbound_address: poolAddress,
    expected_amount_out: expectedAmountOut,
    expiry,
    memo
  } = quoteDeposit

  const slippageThorAmount = sub(thorAmount, expectedAmountOut)
  const slippageDisplayAmount = div(
    slippageThorAmount,
    THOR_LIMIT_UNITS,
    DIVIDE_PRECISION
  )
  const slippageNativeAmount = await mul(slippageDisplayAmount, multiplier)
  const utxoSourceAddress = primaryAddress
  const forceChangeAddress = primaryAddress
  let needsFundingPrimary = false
  let networkFee = '0'

  const sourceTokenContractAddressAllCaps = asset.split('-')[1]
  const sourceTokenContractAddress =
    sourceTokenContractAddressAllCaps != null
      ? sourceTokenContractAddressAllCaps.toLowerCase()
      : undefined

  let memoValue: string | undefined
  let memoType: EdgeMemo['type'] | undefined
  let approvalData: string | undefined
  let router: string | undefined
  let routerAmount: string | undefined

  if (isEvm && isToken) {
    if (sourceTokenContractAddress == null)
      throw new Error(`Missing sourceTokenContractAddress for ${asset}`)

    const [chain] = asset.split('.')
    router = inboundAddresses?.find(ia => ia.chain === chain)?.router

    if (router == null) throw new Error(`Missing router address for ${asset}`)
    // Need to use ethers.js to craft a proper tx that calls Thorchain contract, then extract the data payload
    if (poolAddress == null) {
      throw new Error('Invalid vault address')
    }
    memoType = 'hex'
    memoValue = (
      await getEvmDepositWithExpiryData({
        assetAddress: sourceTokenContractAddress,
        amountToDepositWei: Number(nativeAmount),
        contractAddress: router,
        vaultAddress: poolAddress,
        memo,
        expiry
      })
    ).replace('0x', '')

    // Token transactions send no ETH (or other EVM mainnet coin)
    routerAmount = '0'

    // Check if token approval is required and return necessary data field
    approvalData = await getEvmApprovalData({
      contractAddress: router,
      assetAddress: sourceTokenContractAddress,
      nativeAmount
    })
  }

  // Validate that we're doing a router token deposit or not
  if (isToken) {
    assert(router != null, 'Missing router')
    assert(routerAmount != null, 'Missing routerAmount')
    assert(memoType != null, 'Missing memoType')
    assert(memoValue != null, 'Missing memoValue')

    if (lt(walletBalance, nativeAmount)) {
      throw new InsufficientFundsError({ tokenId: null })
    }
  } else {
    assert(router == null, 'router must be null')
    assert(routerAmount == null, 'routerAmount must be null')
    assert(memoType == null, 'memoType must be null')
    assert(memoValue == null, 'memoValue must be null')
  }

  // Try to spend right out of the primaryAddress
  const spendInfo: EdgeSpendInfo = {
    tokenId,
    spendTargets: [
      {
        publicAddress: router ?? poolAddress,
        nativeAmount: routerAmount ?? nativeAmount
      }
    ],
    memos:
      memoType == null || memoValue == null
        ? undefined
        : [
            {
              type: memoType,
              value: memoValue
            }
          ],

    // Use otherParams to meet Thorchain Savers requirements
    // 1. Sort the outputs by how they are sent to makeSpend making the target output the 1st, change 2nd
    // 2. Only use UTXOs from the primary address (index 0)
    // 3. Force change to go to the primary address
    otherParams: {
      enableRbf: false,
      outputSort: 'targets',
      utxoSourceAddress,
      forceChangeAddress
    },
    assetAction: { assetActionType: 'stake' },
    savedAction: {
      actionType: 'stake',
      pluginId: stakeProviderInfo.pluginId,
      stakeAssets: [
        {
          pluginId,
          tokenId,
          nativeAmount
        }
      ]
    }
  }

  if (isEvm && !isToken) {
    // For mainnet coins of EVM chains, use gasLimit override since makeSpend doesn't
    // know how to estimate an ETH spend with extra data
    spendInfo.networkFeeOption = 'custom'
    spendInfo.customNetworkFee = {
      ...spendInfo.customNetworkFee,
      gasLimit: EVM_SEND_GAS
    }
  }

  if (!isToken && lt(addressBalance, nativeAmount)) {
    // Easy check to see if primary address doesn't have enough funds
    if (isEvm) {
      // EVM chains only have one address, so if there aren't enough funds in
      // the primary address then we don't have enough funds at all
      throw new InsufficientFundsError({ tokenId: null })
    }
    needsFundingPrimary = true
  } else {
    try {
      const estimateTx = await wallet.makeSpend(spendInfo)
      networkFee = estimateTx.parentNetworkFee ?? estimateTx.networkFee
    } catch (e: unknown) {
      if (!isEvm && asMaybeInsufficientFundsError(e) != null) {
        needsFundingPrimary = true
      } else {
        throw e
      }
    }
  }

  let fundingSpendInfo: EdgeSpendInfo | undefined
  if (needsFundingPrimary) {
    // Estimate the total cost to create the two transactions
    // 1. Fund the primary address with the requestedAmount + fees for tx #2
    // 2. Send the requested amount to the pool address
    fundingSpendInfo = {
      tokenId: null,
      spendTargets: [
        {
          publicAddress: primaryAddress,
          nativeAmount: nativeAmount
        }
      ],
      assetAction: { assetActionType: 'stakeNetworkFee' },
      savedAction: {
        actionType: 'stake',
        pluginId: stakeProviderInfo.pluginId,
        stakeAssets: [
          {
            pluginId,
            tokenId,
            nativeAmount
          }
        ]
      },
      otherParams: { forceChangeAddress, enableRbf: false }
    }

    const estimateTx = await wallet.makeSpend(fundingSpendInfo)
    networkFee = estimateTx.networkFee

    // The actual funding transaction will need to fund enought for the staking amount
    // plus the fees for the staking transaction
    fundingSpendInfo.spendTargets[0].nativeAmount = add(
      networkFee,
      nativeAmount
    )

    const remainingBalance = sub(
      sub(walletBalance, mul(networkFee, '2')),
      nativeAmount
    )
    if (lt(remainingBalance, '0')) {
      throw new InsufficientFundsError({ tokenId: null })
    }
  }

  let approvalFee = '0'
  let approvalTx: EdgeTransaction | undefined
  if (approvalData != null) {
    approvalData = approvalData.replace('0x', '')

    const spendInfo: EdgeSpendInfo = {
      tokenId,
      memos: [
        {
          type: 'hex',
          value: approvalData
        }
      ],
      spendTargets: [
        {
          nativeAmount: '0',
          publicAddress: sourceTokenContractAddress
        }
      ],
      assetAction: { assetActionType: 'tokenApproval' },
      savedAction: {
        actionType: 'tokenApproval',
        tokenApproved: {
          pluginId,
          tokenId,
          nativeAmount
        },
        tokenContractAddress: sourceTokenContractAddress ?? '',
        contractAddress: router ?? ''
      }
    }
    approvalTx = await wallet.makeSpend(spendInfo)
    approvalFee = approvalTx.parentNetworkFee ?? approvalTx.networkFee
  }

  const fee = add(
    approvalFee,
    needsFundingPrimary ? mul(networkFee, '2') : networkFee
  )

  let quoteInfo: QuoteInfo | undefined
  const allocations: QuoteAllocation[] = [
    {
      allocationType: 'stake',
      pluginId,
      currencyCode,
      nativeAmount
    },
    {
      allocationType: 'networkFee',
      pluginId,
      currencyCode: wallet.currencyInfo.currencyCode,
      nativeAmount: toFixed(fee, 0, 0)
    },
    {
      allocationType: 'deductedFee',
      pluginId,
      currencyCode,
      nativeAmount: toFixed(slippageNativeAmount, 0, 0)
    }
  ]

  const futureUnstakeFee = await estimateUnstakeFee(
    opts,
    request,
    asset,
    parentToTokenRate,
    parentBalance
  ).catch(e => {
    console.error(e.message)
  })

  if (futureUnstakeFee != null) {
    allocations.push({
      allocationType: 'futureUnstakeFee',
      pluginId,
      currencyCode,
      nativeAmount: toFixed(futureUnstakeFee, 0, 0)
    })

    // Calculate the amount of time needed to break even from just fees

    const feeInParentExchangeAmount = div(
      fee,
      parentMultiplier,
      parentMultiplier.length
    )
    const feeInTokenExchangeAmount = mul(
      feeInParentExchangeAmount,
      parentToTokenRate.toString()
    )
    const feeInTokenNativeAmount = mul(feeInTokenExchangeAmount, multiplier)

    const totalFee = add(
      add(feeInTokenNativeAmount, slippageNativeAmount),
      futureUnstakeFee
    )
    const policy = policies.find(
      policy => policy.stakePolicyId === stakePolicyId
    )
    if (policy == null) {
      throw new Error(`Cannot find policy ${stakePolicyId}`)
    }
    const totalFeePercent = (Number(totalFee) / Number(nativeAmount)) * 100
    const { apy } = policy

    if (apy == null || apy <= 0) {
      quoteInfo = {}
    } else {
      const breakEvenYears = totalFeePercent / apy
      const breakEvenDays = breakEvenYears * 365
      quoteInfo = {
        breakEvenDays
      }
    }
  }

  return {
    allocations,
    quoteInfo,
    approve: async () => {
      if (fundingSpendInfo != null) {
        assert(
          approvalTx == null,
          'Cannot have both funding tx and approval tx'
        )
        // Transfer funds into the primary address
        const tx = await wallet.makeSpend(fundingSpendInfo)
        const signedTx = await wallet.signTx(tx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      if (approvalTx != null) {
        const signedTx = await wallet.signTx(approvalTx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      // Spend from primary address to pool address
      const tx = await wallet.makeSpend(spendInfo)
      const signedTx = await wallet.signTx(tx)
      const broadcastedTx = await wallet.broadcastTx(signedTx)
      await wallet.saveTx(broadcastedTx)
    }
  }
}

const tcAssetToEdge = (
  asset: string
): { pluginId: string; currencyCode: string } | undefined => {
  const [chainCode, currency] = asset.split('.')
  const [currencyCode] = currency.split('-')
  const pluginId = tcChainCodePluginIdMap[chainCode]

  if (pluginId != null && currencyCode != null)
    return { currencyCode, pluginId }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unstakeRequest = async (
  opts: EdgeGuiPluginOptions,
  request: ChangeQuoteRequest
): Promise<ChangeQuote> => {
  const { allocations } = await getStakePosition(opts, request)
  const { wallet, currencyCode, account } = request
  const { addressBalance, parentBalance, primaryAddress } =
    await getPrimaryAddress(account, wallet, currencyCode)
  return await unstakeRequestInner(opts, request, {
    addressBalance,
    allocations,
    parentBalance,
    primaryAddress
  })
}

interface UnstakeRequestParams {
  allocations: PositionAllocation[]
  primaryAddress: string
  addressBalance: string
  parentBalance: string
}

const unstakeRequestInner = async (
  opts: EdgeGuiPluginOptions,
  request: ChangeQuoteRequest,
  params: UnstakeRequestParams
): Promise<ChangeQuote> => {
  const { allocations, primaryAddress, parentBalance, addressBalance } = params
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const {
    action,
    wallet,
    nativeAmount: requestNativeAmount,
    currencyCode,
    account
  } = request
  const multiplier = getCurrencyCodeMultiplier(
    wallet.currencyConfig,
    currencyCode
  )
  const { pluginId } = wallet.currencyInfo

  const tokenId = getTokenId(wallet.currencyConfig, currencyCode) ?? null
  const isToken = tokenId != null
  const isEvm = EVM_PLUGINIDS[pluginId]

  const policyCurrencyInfo = policyCurrencyInfos[pluginId]
  const { minAmount } = policyCurrencyInfo

  let stakedAmount = '0'
  let earnedAmount = '0'
  const redeemableValue = allocations.reduce((prev, alloc) => {
    const { allocationType, nativeAmount: allocAmount } = alloc
    if (allocationType === 'staked') {
      stakedAmount = allocAmount
      return add(prev, allocAmount)
    }
    if (allocationType === 'earned') {
      earnedAmount = allocAmount
      return add(prev, allocAmount)
    }
    return prev
  }, '0')

  const nativeAmount = gt(requestNativeAmount, stakedAmount)
    ? stakedAmount
    : requestNativeAmount

  let totalUnstakeNativeAmount = '0'
  if (action === 'unstake') {
    // If action === unstake
    // User can only request to withdraw the original stakedAmount. The earned amount
    // is always withdrawn as well so add the two together.
    totalUnstakeNativeAmount = toFixed(add(nativeAmount, earnedAmount), 0, 0)
  } else if (action === 'unstakeExact') {
    // If action === unstakeExact
    // Only unstake the exact amount specified in the request.nativeAmount
    totalUnstakeNativeAmount = nativeAmount
  } else {
    // If action === claim
    // The user will be explicitly unstaking the earned amount
    totalUnstakeNativeAmount = earnedAmount
  }

  // Get a percent of redeemableValue from what user entered +
  let fractionToUnstake = div(
    totalUnstakeNativeAmount,
    redeemableValue,
    DIVIDE_PRECISION
  )
  if (gt(fractionToUnstake, '1')) {
    fractionToUnstake = '1'
  }

  const totalUnstakeExchangeAmount = div(
    totalUnstakeNativeAmount,
    multiplier,
    multiplier.length
  )
  const totalUnstakeThorAmount = toFixed(
    mul(totalUnstakeExchangeAmount, THOR_LIMIT_UNITS),
    0,
    0
  )

  const withdrawBps = toFixed(
    mul(fractionToUnstake, TC_SAVERS_WITHDRAWAL_SCALE_UNITS),
    0,
    0
  )
  const asset = edgeToTcAsset(wallet.currencyConfig, currencyCode)

  const path = `/thorchain/quote/saver/withdraw?asset=${asset}&address=${primaryAddress}&amount=${totalUnstakeThorAmount}&withdraw_bps=${withdrawBps}`
  const quoteDeposit = await cleanMultiFetch(
    asQuoteDeposit,
    thornodeServers,
    path,
    { headers: { 'x-client-id': ninerealmsClientId } }
  )
  if ('error' in quoteDeposit) {
    const { error } = quoteDeposit
    if (error.includes('not enough fee')) {
      throw new StakeBelowLimitError(request, currencyCode)
    }
    throw new Error(error)
  }
  const {
    inbound_address: poolAddress,
    expected_amount_out: expectedAmountOut,
    memo
  } = quoteDeposit

  const slippageThorAmount = sub(totalUnstakeThorAmount, expectedAmountOut)
  const slippageDisplayAmount = div(
    slippageThorAmount,
    THOR_LIMIT_UNITS,
    DIVIDE_PRECISION
  )
  const slippageNativeAmount = mul(slippageDisplayAmount, multiplier)
  const { primaryAddress: utxoSourceAddress } = await getPrimaryAddress(
    account,
    wallet,
    currencyCode
  )
  const forceChangeAddress = utxoSourceAddress

  let needsFundingPrimary = false
  let networkFee = '0'

  // Send the dust amount so thorchain picks up the transaction
  const sendNativeAmount = isEvm ? EVM_WITHDRAWAL_MIN_AMOUNT : minAmount

  // For tokens, we always spend the mainnet coin which is assumed to be a single address chain
  // For withdrawing mainnet coins, we might spend from a UTXO chain so we need to check the
  // balance of the 'primary' address (address index 0)
  const balanceToCheck = isToken ? parentBalance : addressBalance

  let memoValue: string = memo
  let memoType: EdgeMemo['type'] = 'text'

  if (isEvm) {
    memoValue = Buffer.from(memo).toString('hex')
    memoType = 'hex'
  }

  const spendInfo: EdgeSpendInfo = {
    // For unstaking we always send just the mainnet coin since we are only sending a message
    // to the Thorchain pool to withdraw the funds
    tokenId: null,
    spendTargets: [
      { publicAddress: poolAddress, nativeAmount: sendNativeAmount }
    ],
    otherParams: {
      enableRbf: false,
      outputSort: 'targets',
      utxoSourceAddress,
      forceChangeAddress
    },
    assetAction: { assetActionType: 'unstakeOrder' },
    savedAction: {
      actionType: 'stake',
      pluginId: stakeProviderInfo.pluginId,
      stakeAssets: [
        {
          pluginId,
          tokenId,
          nativeAmount: totalUnstakeNativeAmount
        }
      ]
    },
    memos: [
      {
        type: memoType,
        value: memoValue
      }
    ]
  }

  if (isEvm) {
    // For mainnet coins of EVM chains, use gasLimit override since makeSpend doesn't
    // know how to estimate an ETH spend with extra data
    spendInfo.networkFeeOption = 'custom'
    spendInfo.customNetworkFee = {
      ...spendInfo.customNetworkFee,
      gasLimit: EVM_SEND_GAS
    }
  }

  if (lt(balanceToCheck, sendNativeAmount)) {
    // Easy check to see if primary address doesn't have enough funds
    if (isEvm) {
      // EVM chains only have one address, so if there aren't enough funds in
      // the primary address then we don't have enough funds at all
      throw new InsufficientFundsError({ tokenId: null })
    }
    // Easy check to see if primary address doesn't have enough funds
    needsFundingPrimary = true
  } else {
    try {
      // Try to spend the mainnet coin right out of the primaryAddress
      const estimateTx = await wallet.makeSpend(spendInfo)
      networkFee = estimateTx.networkFee
    } catch (e: unknown) {
      if (!isEvm && asMaybeInsufficientFundsError(e) != null) {
        needsFundingPrimary = true
      } else {
        throw e
      }
    }
  }

  if (needsFundingPrimary) {
    // Estimate the total cost to create the two transactions
    // 1. Fund the primary address with the sendNativeAmount + fees for tx #2
    // 2. Send the requested amount to the pool address

    const estimateTx = await wallet.makeSpend({
      tokenId: null,
      spendTargets: [
        { publicAddress: primaryAddress, nativeAmount: sendNativeAmount }
      ],
      memos: [
        {
          type: memoType,
          value: memoValue
        }
      ],
      assetAction: { assetActionType: 'unstakeNetworkFee' },
      savedAction: {
        actionType: 'stake',
        pluginId: stakeProviderInfo.pluginId,
        stakeAssets: [
          {
            pluginId,
            tokenId,
            nativeAmount: totalUnstakeNativeAmount
          }
        ]
      }
    })
    networkFee = estimateTx.networkFee

    const remainingBalance = sub(
      sub(parentBalance, mul(networkFee, '2')),
      sendNativeAmount
    )
    if (lt(remainingBalance, '0')) {
      throw new InsufficientFundsError({ tokenId: null })
    }
  }

  const fee = needsFundingPrimary ? mul(networkFee, '2') : networkFee
  return {
    allocations: [
      {
        allocationType: 'unstake',
        pluginId,
        currencyCode,
        nativeAmount: totalUnstakeNativeAmount
      },
      {
        allocationType: 'networkFee',
        pluginId,
        currencyCode: wallet.currencyInfo.currencyCode,
        nativeAmount: add(sendNativeAmount, toFixed(fee, 0, 0))
      },
      {
        allocationType: 'deductedFee',
        pluginId,
        currencyCode,
        nativeAmount: toFixed(slippageNativeAmount, 0, 0)
      }
    ],
    approve: async () => {
      if (needsFundingPrimary) {
        // Transfer funds into the primary address
        const tx = await wallet.makeSpend({
          tokenId: null,
          spendTargets: [
            {
              publicAddress: primaryAddress,
              nativeAmount: add(networkFee, sendNativeAmount)
            }
          ],
          assetAction: { assetActionType: 'unstakeNetworkFee' },
          savedAction: {
            actionType: 'stake',
            pluginId: stakeProviderInfo.pluginId,
            stakeAssets: [
              {
                pluginId,
                tokenId,
                nativeAmount
              }
            ]
          },
          otherParams: { enableRbf: false, forceChangeAddress }
        })
        const signedTx = await wallet.signTx(tx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      // Spend from primary address to pool address
      const tx = await wallet.makeSpend(spendInfo)
      const signedTx = await wallet.signTx(tx)
      const broadcastedTx = await wallet.broadcastTx(signedTx)
      await wallet.saveTx(broadcastedTx)
    }
  }
}

const claimRequest = async (
  opts: EdgeGuiPluginOptions,
  request: ChangeQuoteRequest
): Promise<ChangeQuote> => {
  const { wallet, account } = request
  const { currencyCode, pluginId } = wallet.currencyInfo
  const dustThreshold = CLAIMING_DUST_THRESHOLDS[currencyCode]
  if (dustThreshold == null) throw new Error('unknown dust threshold')
  const nativeAmount = add(dustThreshold, '1') // amount sent must exceed the dust threshold

  const tokenId = getWalletTokenId(wallet, currencyCode)
  const isEvm = EVM_PLUGINIDS[pluginId]

  const walletBalance = wallet.balanceMap.get(tokenId) ?? '0'

  if (lt(walletBalance, nativeAmount)) {
    throw new InsufficientFundsError({ tokenId })
  }

  await updateInboundAddresses(opts)

  const { primaryAddress, addressBalance } = await getPrimaryAddress(
    account,
    wallet,
    currencyCode
  )

  const asset = edgeToTcAsset(wallet.currencyConfig, currencyCode)
  const [chain] = asset.split('.')
  const poolAddress = inboundAddresses?.find(ia => ia.chain === chain)?.address
  if (poolAddress == null) {
    throw new Error('Missing pool address')
  }

  const utxoSourceAddress = primaryAddress
  const forceChangeAddress = primaryAddress

  let thorchainWallet = Object.values(account.currencyWallets).find(
    wallet => wallet.currencyInfo.pluginId === 'thorchainrune'
  )

  if (thorchainWallet == null) {
    // Make sure the user has a Thorchain wallet to receive the TCY
    console.log('Thorchain wallet not found, creating one')
    thorchainWallet = await account.createCurrencyWallet(
      'wallet:thorchainrune',
      {
        fiatCurrencyCode: wallet.fiatCurrencyCode,
        name: lstrings.string_first_thorchainrune_wallet_name,
        enabledTokenIds: ['tcy']
      }
    )
  }

  if (!thorchainWallet.enabledTokenIds.includes('tcy')) {
    await thorchainWallet.changeEnabledTokenIds([
      ...thorchainWallet.enabledTokenIds,
      'tcy'
    ])
  }
  const thorchainAddresses = await thorchainWallet.getAddresses({
    tokenId: null
  })
  const thorchainAddress = thorchainAddresses[0].publicAddress

  let router: string | undefined
  let memoValue = `tcy:${thorchainAddress}`
  let memoType: EdgeMemo['type'] = 'text'
  if (isEvm) {
    router = inboundAddresses?.find(ia => ia.chain === chain)?.router
    if (router == null) {
      throw new Error('Missing router address')
    }

    const currentTimeSeconds = Math.floor(Date.now() / 1000)
    const expiryTimeSeconds = currentTimeSeconds + 60 * 60 // 60 minutes in seconds

    memoType = 'hex'
    memoValue = (
      await getEvmDepositWithExpiryData({
        assetAddress: '0x0000000000000000000000000000000000000000',
        amountToDepositWei: Number(nativeAmount),
        contractAddress: router,
        vaultAddress: poolAddress,
        memo: `tcy:${thorchainAddress}`,
        expiry: expiryTimeSeconds
      })
    ).replace('0x', '')
  }

  const claimableTcy = await fetchClaimableTcy(opts, primaryAddress)

  // Try to spend right out of the primaryAddress
  const spendInfo: EdgeSpendInfo = {
    tokenId,
    spendTargets: [
      {
        publicAddress: router ?? poolAddress,
        nativeAmount: nativeAmount
      }
    ],
    memos: [
      {
        type: memoType,
        value: memoValue
      }
    ],

    // Use otherParams to meet Thorchain Savers requirements
    // 1. Sort the outputs by how they are sent to makeSpend making the target output the 1st, change 2nd
    // 2. Only use UTXOs from the primary address (index 0)
    // 3. Force change to go to the primary address
    otherParams: {
      enableRbf: false,
      outputSort: 'targets',
      utxoSourceAddress,
      forceChangeAddress
    },
    metadata: {
      name: 'TCY Claiming',
      category: 'income:Claim',
      notes: `Claimed Thorchain TCY token`
    },
    assetAction: { assetActionType: 'claim' },
    savedAction: {
      actionType: 'stake',
      pluginId: stakeProviderInfo.pluginId,
      stakeAssets: [
        {
          pluginId: 'thorchainrune',
          tokenId: 'tcy',
          nativeAmount: claimableTcy
        }
      ]
    }
  }

  if (isEvm) {
    // For mainnet coins of EVM chains, use gasLimit override since makeSpend doesn't
    // know how to estimate an ETH spend with extra data
    spendInfo.networkFeeOption = 'custom'
    spendInfo.customNetworkFee = {
      ...spendInfo.customNetworkFee,
      gasLimit: EVM_SEND_GAS
    }
  }

  let networkFee = '0'
  let needsFundingPrimary = false
  if (lt(addressBalance, nativeAmount)) {
    // Easy check to see if primary address doesn't have enough funds
    if (isEvm) {
      // EVM chains only have one address, so if there aren't enough funds in
      // the primary address then we don't have enough funds at all
      throw new InsufficientFundsError({ tokenId: null })
    }
    needsFundingPrimary = true
  } else {
    try {
      const estimateTx = await wallet.makeSpend(spendInfo)
      networkFee = estimateTx.parentNetworkFee ?? estimateTx.networkFee
    } catch (e: unknown) {
      if (!isEvm && asMaybeInsufficientFundsError(e) != null) {
        needsFundingPrimary = true
      } else {
        throw e
      }
    }
  }

  let fundingSpendInfo: EdgeSpendInfo | undefined
  if (needsFundingPrimary) {
    // Estimate the total cost to create the two transactions
    // 1. Fund the primary address with the requestedAmount + fees for tx #2
    // 2. Send the requested amount to the pool address
    fundingSpendInfo = {
      tokenId: null,
      spendTargets: [
        {
          publicAddress: primaryAddress,
          nativeAmount: nativeAmount
        }
      ],
      assetAction: { assetActionType: 'unstakeNetworkFee' },
      savedAction: {
        actionType: 'stake',
        pluginId: stakeProviderInfo.pluginId,
        stakeAssets: [
          {
            pluginId: 'thorchainrune',
            tokenId: 'tcy',
            nativeAmount: claimableTcy
          }
        ]
      },
      otherParams: { forceChangeAddress, enableRbf: false }
    }

    const estimateTx = await wallet.makeSpend(fundingSpendInfo)
    networkFee = estimateTx.networkFee

    // The actual funding transaction will need to fund enough for the staking amount
    // plus the fees for the staking transaction
    fundingSpendInfo.spendTargets[0].nativeAmount = add(
      networkFee,
      nativeAmount
    )

    const remainingBalance = sub(
      sub(walletBalance, mul(networkFee, '2')),
      nativeAmount
    )
    if (lt(remainingBalance, '0')) {
      throw new InsufficientFundsError({ tokenId: null })
    }
  }

  const fee = needsFundingPrimary ? mul(networkFee, '2') : networkFee

  const allocations: QuoteAllocation[] = [
    {
      allocationType: 'networkFee',
      pluginId,
      currencyCode: wallet.currencyInfo.currencyCode,
      nativeAmount: add(toFixed(fee, 0, 0), nativeAmount) // we're adding the dust amount to the network fee since it cannot be unclaimed
    },
    {
      allocationType: 'claim',
      pluginId: 'thorchainrune',
      currencyCode: 'TCY',
      nativeAmount: claimableTcy
    }
  ]

  return {
    allocations,
    approve: async () => {
      if (fundingSpendInfo != null) {
        // Transfer funds into the primary address
        const tx = await wallet.makeSpend(fundingSpendInfo)
        const signedTx = await wallet.signTx(tx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      // Spend from primary address to pool address
      const tx = await wallet.makeSpend(spendInfo)
      const signedTx = await wallet.signTx(tx)
      const broadcastedTx = await wallet.broadcastTx(signedTx)
      await wallet.saveTx(broadcastedTx)
      claimedTcyHack.add(primaryAddress)
    }
  }
}

const headers = {
  'Content-Type': 'application/json'
}

// ----------------------------------------------------------------------------
// Estimate the fees to unstake by faking an unstake calculation using the
// address and amount from the staked address in the savers pool that has a
// staked amount just above the requested unstake amount.
// This will calculate the withdrawBps for the fake
// unstake by using the ratio of the requested unstake amount compared to the
// total amount of the largest staked address
// ----------------------------------------------------------------------------
const estimateUnstakeFee = async (
  opts: EdgeGuiPluginOptions,
  request: ChangeQuoteRequest,
  asset: string,
  parentToTokenRate: number,
  parentBalance: string
): Promise<string> => {
  const { currencyCode, nativeAmount, wallet } = request
  const multiplier = getCurrencyCodeMultiplier(
    wallet.currencyConfig,
    currencyCode
  )
  const parentCurrencyCode = wallet.currencyInfo.currencyCode
  const parentMultiplier = getCurrencyCodeMultiplier(
    wallet.currencyConfig,
    parentCurrencyCode
  )

  const [pool, savers] = await Promise.all([
    fetchPool(opts, asset),
    fetchSavers(opts, asset)
  ])
  if (pool == null)
    throw new Error('Cannot estimate unstake fee: No pool found')
  if (savers.length === 0)
    throw new Error('Cannot estimate unstake fee: No savers found')

  // Loop over all the Savers and find the one that has a position just higher
  // than the requested stake amount
  let stakePosition
  let primaryAddress = ''
  let bestNativeAmount = '0'
  for (const saver of savers) {
    primaryAddress = saver.asset_address
    stakePosition = saverToPosition(
      wallet.currencyConfig,
      currencyCode,
      saver,
      pool
    )
    const { allocations } = stakePosition
    for (const alloc of allocations) {
      if (alloc.allocationType !== 'staked') continue
      if (lt(alloc.nativeAmount, nativeAmount)) continue

      if (
        eq(bestNativeAmount, '0') ||
        lt(alloc.nativeAmount, bestNativeAmount)
      ) {
        bestNativeAmount = alloc.nativeAmount
        break
      }
    }

    // Early exit once we have a position that's no more than 10x larger than the
    // requested stake amount. Continuing could cost 10s of seconds to complete
    const bestAmtMultiplier = div(
      bestNativeAmount,
      nativeAmount,
      DIVIDE_PRECISION
    )
    if (lt(bestAmtMultiplier, '10')) {
      break
    }
  }
  if (eq(bestNativeAmount, '0'))
    throw new Error(
      'Could not find sufficient current staker to estimate unstake'
    )
  if (stakePosition == null)
    throw new Error('Could not get stakePosition. Should not happen')

  const { allocations } = stakePosition

  const addressBalance = nativeAmount
  const unstakeQuote = await unstakeRequestInner(
    opts,
    { ...request, action: 'unstakeExact' },
    {
      addressBalance,
      allocations,
      parentBalance,
      // This is the address of the example staker, NOT the customer wallet:
      primaryAddress
    }
  )

  const networkFee = unstakeQuote.allocations.find(
    a => a.allocationType === 'networkFee'
  )
  const stakeFee = unstakeQuote.allocations.find(
    a => a.allocationType === 'deductedFee'
  )

  if (networkFee == null || stakeFee == null)
    throw new Error('Cannot estimate unstake fee: No fees found')

  // If staking a token, convert the networkFree from the parent currency to the staked currency
  if (currencyCode !== parentCurrencyCode) {
    const parentFeeExchangeAmount = div(
      networkFee.nativeAmount,
      parentMultiplier,
      parentMultiplier.length
    )
    const feeInTokenExchangeAmount = mul(
      parentFeeExchangeAmount,
      parentToTokenRate.toString()
    )
    const feeInTokenNativeAmount = mul(feeInTokenExchangeAmount, multiplier)
    return add(stakeFee.nativeAmount, feeInTokenNativeAmount)
  } else {
    return add(networkFee.nativeAmount, stakeFee.nativeAmount)
  }
}

const updateInboundAddresses = async (
  opts: EdgeGuiPluginOptions
): Promise<void> => {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const now = Date.now()
  if (
    now - exchangeInfoLastUpdate > EXCHANGE_INFO_UPDATE_FREQ_MS ||
    exchangeInfo == null
  ) {
    try {
      const exchangeInfoResponse = await fetchInfo('v1/exchangeInfo/edge')

      if (exchangeInfoResponse.ok) {
        const responseJson = await exchangeInfoResponse.json()
        exchangeInfo = asThorchainExchangeInfo(responseJson)
        exchangeInfoLastUpdate = now
      } else {
        // Error is ok. We just use defaults
        console.warn(
          'Error getting info server exchangeInfo. Using defaults...'
        )
      }
    } catch (e: any) {
      console.log(
        'Error getting info server exchangeInfo. Using defaults...',
        e.message
      )
    }
  }

  try {
    if (exchangeInfo != null) {
      midgardServers = exchangeInfo.swap.plugins.thorchain.midgardServers
      thornodeServers =
        exchangeInfo.swap.plugins.thorchain.thornodeServers ?? thornodeServers
    }

    if (
      now - inboundAddressesLastUpdate > INBOUND_ADDRESSES_UPDATE_FREQ_MS ||
      inboundAddresses == null
    ) {
      // Get current pool
      const [iaResponse] = await Promise.all([
        fetchWaterfall(thornodeServers, 'thorchain/inbound_addresses', {
          headers: { ...headers, 'x-client-id': ninerealmsClientId }
        })
      ])

      if (!iaResponse.ok) {
        const responseText = await iaResponse.text()
        throw new Error(
          `Thorchain could not fetch inbound_addresses: ${responseText}`
        )
      }

      const iaJson = await iaResponse.json()
      inboundAddresses = asInboundAddresses(iaJson)
      inboundAddressesLastUpdate = now
    }
  } catch (e: any) {
    console.warn(e.message)
  }
}

const getPrimaryAddress = async (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  currencyCode: string
): Promise<{
  primaryAddress: string
  addressBalance: string
  parentBalance: string
}> => {
  const tokenId = getWalletTokenId(wallet, currencyCode)
  const edgeAddresses = await wallet.getAddresses({
    tokenId: null,
    forceIndex: 0
  })
  const edgeAddress = edgeAddresses.find(
    eAddress => eAddress.addressType === 'segwitAddress'
  )
  if (edgeAddress == null) {
    throw new Error('No segwit address found')
  }

  const { publicAddress, nativeBalance } = edgeAddress

  // If this is a single address chain (ie ETH, AVAX)
  // then the address balance is always the wallet balance
  const displayPublicKey = await account.getDisplayPublicKey(wallet.id)
  const hasSingleAddress =
    displayPublicKey.toLowerCase() === publicAddress.toLowerCase()
  const assetBalance = wallet.balanceMap.get(tokenId) ?? '0'

  return {
    primaryAddress: publicAddress,
    addressBalance: hasSingleAddress ? assetBalance : nativeBalance ?? '0',
    parentBalance: wallet.balanceMap.get(null) ?? '0'
  }
}

const edgeToTcAsset = (
  currencyConfig: EdgeCurrencyConfig,
  currencyCode: string
): string => {
  const { pluginId } = currencyConfig.currencyInfo
  const mainnetCode = MAINNET_CODE_TRANSCRIPTION[pluginId]
  const asset = `${mainnetCode}.${currencyCode}`

  if (currencyConfig.currencyInfo.currencyCode !== currencyCode) {
    const { type } = policyCurrencyInfos[pluginId]

    if (type !== 'evm') {
      throw new Error(
        `Currency type ${type} does not support token savers and currencyCode ${currencyCode} mismatches wallet currency code ${currencyConfig.currencyInfo.currencyCode}`
      )
    }
    const tokenId = getTokenId(currencyConfig, currencyCode)
    if (tokenId == null) {
      throw new Error(
        `getStakePositionInner: Cannot find tokenId for ${pluginId}:${currencyCode}`
      )
    }
    const edgeToken = currencyConfig.allTokens[tokenId]
    if (edgeToken == null) {
      throw new Error(
        `getStakePositionInner: Cannot find edgeToken for ${pluginId}:${tokenId}`
      )
    }

    const { contractAddress } =
      asMaybeContractLocation(edgeToken.networkLocation) ?? {}
    if (contractAddress == null) {
      throw new Error(
        `getStakePositionInner: No contractAddress for ${pluginId}:${tokenId}`
      )
    }

    return `${asset}-${contractAddress.toLocaleUpperCase()}`
  }

  return asset
}

const EVM_PLUGINIDS: { [id: string]: boolean } = {
  avalanche: true,
  binancesmartchain: true,
  ethereum: true
}

async function showDisabledModal(): Promise<void> {
  const result = await Airship.show<'info' | 'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.stake_tc_unavailable}
      message={lstrings.stake_tc_unavailable_message}
      buttons={{
        info: { label: lstrings.learn_more_button },
        ok: { label: lstrings.string_ok }
      }}
    />
  ))
  if (result === 'info')
    await Linking.openURL(
      'https://edge.app/blog/company-news/thorchain-savers-halts/?af=edge-app'
    )
}
