import { add, div, gt, lt, max, mul, sub, toFixed } from 'biggystring'
import { asArray, asBoolean, asEither, asNumber, asObject, asOptional, asString } from 'cleaners'
import { EdgeAccount, EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'

import { cleanMultiFetch, fetchInfo, fetchWaterfall } from '../../../util/network'
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
import { asInfoServerResponse, EdgeGuiPluginOptions, InfoServerResponse } from '../util/internalTypes'

const EXCHANGE_INFO_UPDATE_FREQ_MS = 10 * 60 * 1000 // 2 min
const INBOUND_ADDRESSES_UPDATE_FREQ_MS = 10 * 60 * 1000 // 2 min
const MIDGARD_SERVERS_DEFAULT = ['https://midgard.ninerealms.com', 'https://midgard.thorchain.info']
const THORNODE_SERVERS_DEFAULT = ['https://thornode.ninerealms.com']

// When withdrawing from a vault, this represents a withdrawal of 100% of the staked amount.
// Transactions send minAmount + basis points from 0 - TC_SAVERS_WITHDRAWAL_SCALE_UNITS to
// communicate what % to withdraw. ie. Withdraw 75% of staked amount on LTC sends minAmount + basis points
// to the pool address. (10000 + 7500 sats)
const TC_SAVERS_WITHDRAWAL_SCALE_UNITS = '10000'
const DIVIDE_PRECISION = 18

// Thorchain max units per 1 unit of any supported currency
export const THOR_LIMIT_UNITS = '100000000'

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
  last_add_height: asNumber,
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

const asPools = asArray(asPool)
const asQuoteDeposit = asEither(
  asObject({
    expected_amount_out: asString,
    inbound_address: asString
  }),
  asObject({
    error: asString
  })
)
type Savers = ReturnType<typeof asSavers>
type Pools = ReturnType<typeof asPools>
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
  bitcoin: utxoInfo,
  bitcoincash: utxoInfo,
  dogecoin: { ...utxoInfo, minAmount: '100000000' },
  ethereum: evmInfo,
  litecoin: utxoInfo
}

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Thorchain Savers',
  pluginId: 'thorchain',
  stakeProviderId: 'tcsavers'
}

const policyDefault = {
  apy: 0,
  stakeProviderInfo,
  disableMaxStake: true,
  rewardsNotClaimable: true,
  stakeWarning: null,
  unstakeWarning: null,
  claimWarning: null
}

const policies: StakePolicy[] = [
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/bitcoin:btc=bitcoin:btc',
    rewardAssets: [{ pluginId: 'bitcoin', currencyCode: 'BTC' }],
    stakeAssets: [{ pluginId: 'bitcoin', currencyCode: 'BTC' }]
  },
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/litecoin:ltc=litecoin:ltc',
    rewardAssets: [{ pluginId: 'litecoin', currencyCode: 'LTC' }],
    stakeAssets: [{ pluginId: 'litecoin', currencyCode: 'LTC' }]
  },
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/bitcoincash:bch=bitcoincash:bch',
    rewardAssets: [{ pluginId: 'bitcoincash', currencyCode: 'BCH' }],
    stakeAssets: [{ pluginId: 'bitcoincash', currencyCode: 'BCH' }]
  },
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/dogecoin:doge=dogecoin:doge',
    rewardAssets: [{ pluginId: 'dogecoin', currencyCode: 'DOGE' }],
    stakeAssets: [{ pluginId: 'dogecoin', currencyCode: 'DOGE' }]
  },
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/ethereum:eth=ethereum:eth',
    rewardAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }],
    stakeAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }]
  },
  {
    ...policyDefault,
    stakePolicyId: 'tcsavers/avalanche:avax=avalanche:avax',
    rewardAssets: [{ pluginId: 'avalanche', currencyCode: 'AVAX' }],
    stakeAssets: [{ pluginId: 'avalanche', currencyCode: 'AVAX' }]
  }
]

const MAINNET_CODE_TRANSCRIPTION: { [cc: string]: string } = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  binancechain: 'BNB',
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

export const makeTcSaversPlugin = async (opts: EdgeGuiPluginOptions): Promise<StakePlugin> => {
  asInitOptions(opts.initOptions)
  const fetchResponse = await fetchInfo(`v1/apyValues`)
    .then(async res => {
      if (!res.ok) {
        throw new Error(`Fetch APY invalid response: ${await res.text()}`)
      }
      return res
    })
    .catch(err => {
      const msg = `Fetch APY failed: ${err.message}`
      console.warn(msg)
    })
  if (fetchResponse != null) {
    try {
      const fetchResponseJson = await fetchResponse.json()
      const infoServerResponse = asInfoServerResponse(fetchResponseJson)
      updatePolicyApys(infoServerResponse)
    } catch (err: any) {
      const msg = `Parsing Fetch APY failed: ${err.message}`
      console.warn(msg)
    }
  }

  const instance: StakePlugin = {
    getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
      return filterStakePolicies(policies, filter)
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, currencyCode, wallet } = request
      const policy = getPolicyFromId(stakePolicyId)
      const { pluginId, currencyCode: policyCurrencyCode } = policy.stakeAssets[0]

      if (currencyCode !== policyCurrencyCode) {
        throw new Error('Currency code mismatch between request and policy')
      }

      if (pluginId !== wallet.currencyInfo.pluginId) {
        throw new Error('pluginId mismatch between request and policy')
      }

      if (currencyCode !== wallet.currencyInfo.currencyCode) {
        throw new Error('Only mainnet coins supported for staking')
      }

      return await changeQuoteFuncs[action](opts, request)
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      await updateInboundAddresses(opts)
      return await getStakePosition(opts, request)
    }
  }
  return instance
}

const getStakePosition = async (opts: EdgeGuiPluginOptions, request: StakePositionRequest): Promise<StakePosition> => {
  const { stakePolicyId, wallet, account } = request
  const policy = getPolicyFromId(stakePolicyId)
  const { currencyCode } = policy.stakeAssets[0]
  const { primaryAddress } = await getPrimaryAddress(account, wallet, currencyCode)
  return await getStakePositionInner(opts, request, primaryAddress)
}

const getStakePositionInner = async (opts: EdgeGuiPluginOptions, request: StakePositionRequest, primaryAddress: string): Promise<StakePosition> => {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const { stakePolicyId, wallet } = request
  const policy = getPolicyFromId(stakePolicyId)
  const { pluginId, currencyCode } = policy.stakeAssets[0]
  const mainnetCode = MAINNET_CODE_TRANSCRIPTION[pluginId]
  const asset = `${mainnetCode}.${currencyCode}`

  let pools: Pools = []
  let savers: Savers = []
  const [saversResponse, poolsResponse] = await Promise.all([
    fetchWaterfall(thornodeServers, `thorchain/pool/${asset}/savers`, { headers: { 'x-client-id': ninerealmsClientId } }),
    fetchWaterfall(midgardServers, `v2/pools`, { headers: { 'x-client-id': ninerealmsClientId } })
  ])

  if (!saversResponse.ok) {
    const responseText = await saversResponse.text()
    throw new Error(`Thorchain could not fetch /pool/savers: ${responseText}`)
  }
  const saversJson = await saversResponse.json()
  savers = asSavers(saversJson)

  if (!poolsResponse.ok) {
    const responseText = await poolsResponse.text()
    throw new Error(`Thorchain could not fetch /v2/pools: ${responseText}`)
  }
  const poolsJson = await poolsResponse.json()
  pools = asPools(poolsJson)

  const saver = savers.find(s => s.asset_address.toLowerCase() === primaryAddress.toLowerCase())
  const pool = pools.find(p => p.asset === asset)
  let stakedAmount = '0'
  let earnedAmount = '0'
  if (saver != null && pool != null) {
    const { units, asset_deposit_value: assetDepositValue } = saver
    const { saversDepth, saversUnits } = pool
    stakedAmount = assetDepositValue
    const redeemableValue = div(mul(units, saversDepth), saversUnits, DIVIDE_PRECISION)
    earnedAmount = sub(redeemableValue, stakedAmount)

    // Convert from Thor units to exchangeAmount
    stakedAmount = div(stakedAmount, THOR_LIMIT_UNITS, DIVIDE_PRECISION)
    earnedAmount = div(earnedAmount, THOR_LIMIT_UNITS, DIVIDE_PRECISION)

    // Convert from exchangeAmount to nativeAmount
    stakedAmount = await wallet.denominationToNative(stakedAmount, currencyCode)
    earnedAmount = await wallet.denominationToNative(earnedAmount, currencyCode)

    // Truncate decimals
    stakedAmount = toFixed(stakedAmount, 0, 0)
    earnedAmount = toFixed(earnedAmount, 0, 0)

    // Cap negative value to 0
    earnedAmount = max(earnedAmount, '0')
  }

  const canUnstake = gt(stakedAmount, '0')

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
    canClaim: canUnstake
  }
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

const stakeRequest = async (opts: EdgeGuiPluginOptions, request: ChangeQuoteRequest): Promise<ChangeQuote> => {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)

  const { wallet, nativeAmount, currencyCode, stakePolicyId, account } = request
  const { pluginId } = wallet.currencyInfo

  const walletBalance = wallet.balances[currencyCode]
  const exchangeAmount = await wallet.nativeToDenomination(nativeAmount, currencyCode)
  const thorAmount = toFixed(mul(exchangeAmount, THOR_LIMIT_UNITS), 0, 0)

  if (lt(walletBalance, nativeAmount)) {
    throw new InsufficientFundsError({ currencyCode })
  }

  await updateInboundAddresses(opts)

  const mainnetCode = MAINNET_CODE_TRANSCRIPTION[wallet.currencyInfo.pluginId]
  const { primaryAddress, addressBalance } = await getPrimaryAddress(account, wallet, currencyCode)

  const asset = `${mainnetCode}.${mainnetCode}`

  const path = `/thorchain/quote/saver/deposit?asset=${asset}&address=${primaryAddress}&amount=${thorAmount}`
  const quoteDeposit = await cleanMultiFetch(asQuoteDeposit, thornodeServers, path, { headers: { 'x-client-id': ninerealmsClientId } })
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

  const { inbound_address: poolAddress, expected_amount_out: expectedAmountOut } = quoteDeposit

  const slippageThorAmount = sub(thorAmount, expectedAmountOut)
  const slippageDisplayAmount = div(slippageThorAmount, THOR_LIMIT_UNITS, DIVIDE_PRECISION)
  const slippageNativeAmount = await wallet.denominationToNative(slippageDisplayAmount, currencyCode)
  const utxoSourceAddress = primaryAddress
  const forceChangeAddress = primaryAddress
  let needsFundingPrimary = false
  let networkFee = '0'

  if (lt(addressBalance, nativeAmount)) {
    // Easy check to see if primary address doesn't have enough funds
    needsFundingPrimary = true
  } else {
    try {
      // Try to spend right out of the primaryAddress
      const estimateTx = await wallet.makeSpend({
        spendTargets: [{ publicAddress: poolAddress, nativeAmount }],
        otherParams: { outputSort: 'targets', utxoSourceAddress, forceChangeAddress }
      })
      networkFee = estimateTx.networkFee
    } catch (e: unknown) {
      if (e instanceof InsufficientFundsError) {
        needsFundingPrimary = true
      }
    }
  }

  if (needsFundingPrimary) {
    // Estimate the total cost to create the two transactions
    // 1. Fund the primary address with the requestedAmount + fees for tx #2
    // 2. Send the requested amount to the pool address

    const estimateTx = await wallet.makeSpend({
      spendTargets: [{ publicAddress: primaryAddress, nativeAmount }]
    })
    networkFee = estimateTx.networkFee

    const remainingBalance = sub(sub(walletBalance, mul(networkFee, '2')), nativeAmount)
    if (lt(remainingBalance, '0')) {
      throw new InsufficientFundsError({ currencyCode })
    }
  }

  const fee = needsFundingPrimary ? mul(networkFee, '2') : networkFee

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
      currencyCode,
      nativeAmount: toFixed(fee, 0, 0)
    },
    {
      allocationType: 'deductedFee',
      pluginId,
      currencyCode,
      nativeAmount: toFixed(slippageNativeAmount, 0, 0)
    }
  ]

  const futureUnstakeFee = await estimateUnstakeFee(opts, request, asset, ninerealmsClientId).catch(e => {
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
    const totalFee = add(add(fee, slippageNativeAmount), futureUnstakeFee)
    const policy = policies.find(policy => policy.stakePolicyId === stakePolicyId)
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
      if (needsFundingPrimary) {
        // Transfer funds into the primary address
        const tx = await wallet.makeSpend({
          spendTargets: [
            {
              publicAddress: primaryAddress,
              nativeAmount: add(networkFee, nativeAmount)
            }
          ],
          metadata: { name: 'Thorchain Savers', category: 'Expense:Network Fee' },
          otherParams: { forceChangeAddress }
        })
        const signedTx = await wallet.signTx(tx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      // Spend from primary address to pool address
      const tx = await wallet.makeSpend({
        spendTargets: [{ publicAddress: poolAddress, nativeAmount }],

        // Use otherParams to meet Thorchain Savers requirements
        // 1. Sort the outputs by how they are sent to makeSpend making the target output the 1st, change 2nd
        // 2. Only use UTXOs from the primary address (index 0)
        // 3. Force change to go to the primary address
        otherParams: { outputSort: 'targets', utxoSourceAddress, forceChangeAddress },
        metadata: { name: 'Thorchain Savers', category: 'Transfer:Staking' }
      })
      const signedTx = await wallet.signTx(tx)
      const broadcastedTx = await wallet.broadcastTx(signedTx)
      await wallet.saveTx(broadcastedTx)
    }
  }
}

const unstakeRequest = async (opts: EdgeGuiPluginOptions, request: ChangeQuoteRequest): Promise<ChangeQuote> => {
  const { allocations } = await getStakePosition(opts, request)
  const { wallet, currencyCode, account } = request
  const { addressBalance, primaryAddress } = await getPrimaryAddress(account, wallet, currencyCode)
  return await unstakeRequestInner(opts, request, { addressBalance, allocations, primaryAddress })
}

interface UnstakeRequestParams {
  allocations: PositionAllocation[]
  primaryAddress: string
  addressBalance: string
}

const unstakeRequestInner = async (opts: EdgeGuiPluginOptions, request: ChangeQuoteRequest, params: UnstakeRequestParams): Promise<ChangeQuote> => {
  const { allocations, primaryAddress, addressBalance } = params
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const { action, wallet, nativeAmount: requestNativeAmount, currencyCode, account } = request
  const { pluginId } = wallet.currencyInfo

  const policyCurrencyInfo = policyCurrencyInfos[pluginId]
  const walletBalance = wallet.balances[currencyCode]
  const { minAmount } = policyCurrencyInfo

  if (lt(walletBalance, TC_SAVERS_WITHDRAWAL_SCALE_UNITS)) {
    throw new InsufficientFundsError({ currencyCode })
  }

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

  const nativeAmount = gt(requestNativeAmount, stakedAmount) ? stakedAmount : requestNativeAmount

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
  let fractionToUnstake = div(totalUnstakeNativeAmount, redeemableValue, DIVIDE_PRECISION)
  if (gt(fractionToUnstake, '1')) {
    fractionToUnstake = '1'
  }

  const totalUnstakeExchangeAmount = await wallet.nativeToDenomination(totalUnstakeNativeAmount, currencyCode)
  const totalUnstakeThorAmount = toFixed(mul(totalUnstakeExchangeAmount, THOR_LIMIT_UNITS), 0, 0)

  const withdrawBps = toFixed(mul(fractionToUnstake, TC_SAVERS_WITHDRAWAL_SCALE_UNITS), 0, 0)
  const mainnetCode = MAINNET_CODE_TRANSCRIPTION[wallet.currencyInfo.pluginId]

  const asset = `${mainnetCode}.${mainnetCode}`
  const path = `/thorchain/quote/saver/withdraw?asset=${asset}&address=${primaryAddress}&amount=${totalUnstakeThorAmount}&withdraw_bps=${withdrawBps}`
  const quoteDeposit = await cleanMultiFetch(asQuoteDeposit, thornodeServers, path, { headers: { 'x-client-id': ninerealmsClientId } })
  if ('error' in quoteDeposit) {
    const { error } = quoteDeposit
    if (error.includes('not enough fee')) {
      throw new StakeBelowLimitError(request, currencyCode)
    }
    throw new Error(error)
  }
  const { inbound_address: poolAddress, expected_amount_out: expectedAmountOut } = quoteDeposit

  const slippageThorAmount = sub(totalUnstakeThorAmount, expectedAmountOut)
  const slippageDisplayAmount = div(slippageThorAmount, THOR_LIMIT_UNITS, DIVIDE_PRECISION)
  const slippageNativeAmount = await wallet.denominationToNative(slippageDisplayAmount, currencyCode)
  const { primaryAddress: utxoSourceAddress } = await getPrimaryAddress(account, wallet, currencyCode)
  const forceChangeAddress = utxoSourceAddress

  let needsFundingPrimary = false
  let networkFee = '0'

  // Convert the thorchain denominated send amount to native amount
  const sendThorAmount = add(minAmount, withdrawBps)
  const sendExchangeAmount = div(sendThorAmount, THOR_LIMIT_UNITS, DIVIDE_PRECISION)
  const sendNativeAmountFloat = await wallet.denominationToNative(sendExchangeAmount, currencyCode)
  const sendNativeAmount = toFixed(sendNativeAmountFloat, 0, 0)

  // Convert thorchain amount to nativeAmount
  if (lt(addressBalance, sendNativeAmount)) {
    // Easy check to see if primary address doesn't have enough funds
    needsFundingPrimary = true
  } else {
    try {
      // Try to spend right out of the primaryAddress
      const estimateTx = await wallet.makeSpend({
        spendTargets: [{ publicAddress: poolAddress, nativeAmount: sendNativeAmount }],
        otherParams: { outputSort: 'targets', utxoSourceAddress, forceChangeAddress }
      })
      networkFee = estimateTx.networkFee
    } catch (e: unknown) {
      if (e instanceof InsufficientFundsError) {
        needsFundingPrimary = true
      }
    }
  }

  if (needsFundingPrimary) {
    // Estimate the total cost to create the two transactions
    // 1. Fund the primary address with the sendNativeAmount + fees for tx #2
    // 2. Send the requested amount to the pool address

    const estimateTx = await wallet.makeSpend({
      spendTargets: [{ publicAddress: primaryAddress, nativeAmount: sendNativeAmount }]
    })
    networkFee = estimateTx.networkFee

    const remainingBalance = sub(sub(walletBalance, mul(networkFee, '2')), sendNativeAmount)
    if (lt(remainingBalance, '0')) {
      throw new InsufficientFundsError({ currencyCode })
    }
  }

  const fee = needsFundingPrimary ? mul(networkFee, '2') : networkFee
  return {
    allocations: [
      {
        allocationType: 'unstake',
        pluginId,
        currencyCode,
        nativeAmount
      },
      {
        allocationType: 'networkFee',
        pluginId,
        currencyCode,
        nativeAmount: toFixed(fee, 0, 0)
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
          spendTargets: [
            {
              publicAddress: primaryAddress,
              nativeAmount: add(networkFee, sendNativeAmount)
            }
          ],
          metadata: { name: 'Thorchain Savers', category: 'Expense:Network Fee' },
          otherParams: { forceChangeAddress }
        })
        const signedTx = await wallet.signTx(tx)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }
      // Spend from primary address to pool address
      const tx = await wallet.makeSpend({
        spendTargets: [{ publicAddress: poolAddress, nativeAmount: sendNativeAmount }],

        // Use otherParams to meet Thorchain Savers requirements
        // 1. Sort the outputs by how they are sent to makeSpend making the target output the 1st, change 2nd
        // 2. Only use UTXOs from the primary address (index 0)
        // 3. Force change to go to the primary address
        otherParams: { outputSort: 'targets', utxoSourceAddress, forceChangeAddress },
        metadata: { name: 'Thorchain Savers', category: 'Expense:Withdraw Stake Request' }
      })
      const signedTx = await wallet.signTx(tx)
      const broadcastedTx = await wallet.broadcastTx(signedTx)
      await wallet.saveTx(broadcastedTx)
    }
  }
}

const changeQuoteFuncs = {
  stake: stakeRequest,
  unstake: unstakeRequest,
  claim: unstakeRequest,
  unstakeExact: unstakeRequest
}

const headers = {
  'Content-Type': 'application/json'
}

// ----------------------------------------------------------------------------
// Estimate the fees to unstake by faking an unstake calculation using the
// address and amount from the largest staked address in the savers pool for
// the requested asset. This will calculate the withdrawBps for the fake
// unstake by using the ratio of the requested unstake amount compared to the
// total amount of the largest staked address
// ----------------------------------------------------------------------------
const estimateUnstakeFee = async (opts: EdgeGuiPluginOptions, request: ChangeQuoteRequest, asset: string, ninerealmsClientId: string): Promise<string> => {
  const { nativeAmount, stakePolicyId, wallet, account } = request
  const saversResponse = await fetchWaterfall(thornodeServers, `thorchain/pool/${asset}/savers`, { headers: { 'x-client-id': ninerealmsClientId } })
  if (!saversResponse.ok) {
    const responseText = await saversResponse.text()
    throw new Error(`Thorchain could not fetch /pool/savers: ${responseText}`)
  }
  const saversJson = await saversResponse.json()
  const savers = asSavers(saversJson)

  if (savers.length === 0) throw new Error('Cannot estimate unstake fee: No savers found')
  const bigSaver = savers.reduce((prev, current) => (gt(current.units, prev.units) ? current : prev))
  const primaryAddress = bigSaver.asset_address

  const stakePositionRequest: StakePositionRequest = { stakePolicyId, wallet, account }
  const stakePosition = await getStakePositionInner(opts, stakePositionRequest, primaryAddress)
  const { allocations } = stakePosition

  const addressBalance = nativeAmount
  const unstakeQuote = await unstakeRequestInner(opts, { ...request, action: 'unstakeExact' }, { addressBalance, allocations, primaryAddress })

  const networkFee = unstakeQuote.allocations.find(a => a.allocationType === 'networkFee')
  const stakeFee = unstakeQuote.allocations.find(a => a.allocationType === 'deductedFee')

  if (networkFee == null || stakeFee == null) throw new Error('Cannot estimate unstake fee: No fees found')
  return add(networkFee.nativeAmount, stakeFee.nativeAmount)
}

const updateInboundAddresses = async (opts: EdgeGuiPluginOptions): Promise<void> => {
  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const now = Date.now()
  if (now - exchangeInfoLastUpdate > EXCHANGE_INFO_UPDATE_FREQ_MS || exchangeInfo == null) {
    try {
      const exchangeInfoResponse = await fetchInfo('v1/exchangeInfo/edge')

      if (exchangeInfoResponse.ok) {
        const responseJson = await exchangeInfoResponse.json()
        exchangeInfo = asThorchainExchangeInfo(responseJson)
        exchangeInfoLastUpdate = now
      } else {
        // Error is ok. We just use defaults
        console.warn('Error getting info server exchangeInfo. Using defaults...')
      }
    } catch (e: any) {
      console.log('Error getting info server exchangeInfo. Using defaults...', e.message)
    }
  }

  try {
    if (exchangeInfo != null) {
      midgardServers = exchangeInfo.swap.plugins.thorchain.midgardServers
      thornodeServers = exchangeInfo.swap.plugins.thorchain.thornodeServers ?? thornodeServers
    }

    if (now - inboundAddressesLastUpdate > INBOUND_ADDRESSES_UPDATE_FREQ_MS || inboundAddresses == null) {
      // Get current pool
      const [iaResponse] = await Promise.all([
        fetchWaterfall(midgardServers, 'v2/thorchain/inbound_addresses', {
          headers: { ...headers, 'x-client-id': ninerealmsClientId }
        })
      ])

      if (!iaResponse.ok) {
        const responseText = await iaResponse.text()
        throw new Error(`Thorchain could not fetch inbound_addresses: ${responseText}`)
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
}> => {
  const displayPublicKey = await account.getDisplayPublicKey(wallet.id)
  const { publicAddress, nativeBalance } = await wallet.getReceiveAddress({
    forceIndex: 0,
    currencyCode
  })

  // If this is a single address chain (ie ETH, AVAX)
  // then the address balance is always the wallet balance
  const hasSingleAddress = displayPublicKey.toLowerCase() === publicAddress.toLowerCase()

  return {
    primaryAddress: publicAddress,
    addressBalance: hasSingleAddress ? wallet.balances[currencyCode] : nativeBalance ?? '0'
  }
}
