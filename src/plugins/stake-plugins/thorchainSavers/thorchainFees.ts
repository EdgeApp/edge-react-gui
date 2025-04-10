/**
 * Thorchain Fee Calculation System
 *
 * This file contains constants, types, and utility functions for calculating
 * Thorchain fees according to the official documentation.
 *
 * There are 4 different fees the user should know about:
 * 1. Inbound Fee (sourceChain: gasRate * txSize)
 * 2. Affiliate Fee (affiliateFee * swapAmount)
 * 3. Liquidity Fee (swapSlip * swapAmount)
 * 4. Outbound Fee (destinationChain: gasRate * txSize)
 *
 * Fees are taken in the following order when conducting a swap:
 * 1. Inbound Fee (user wallet controlled, not THORChain controlled)
 * 2. Swap Fee (denoted in output asset)
 * 3. Affiliate Fee (if any)
 * 4. Outbound Fee (taken from the swap output)
 */

import { add, div, gt, lt, mul } from 'biggystring'

// Constants for fee calculations
export const FEE_PRECISION = 8 // Standard precision for fee calculations
export const BASIS_POINTS_DIVISOR = '10000' // 100% in basis points
export const THORCHAIN_NATIVE_FEE = '2000000' // 0.02 RUNE (in 1e8 units)
export const MIN_USD_FEE = '1' // Minimum fee in USD

// Default transaction sizes in bytes
export const TX_SIZE = {
  UTXO: 250, // Standard UTXO tx size (e.g., Bitcoin)
  ETH: 21000, // Standard ETH transaction gas units
  ERC20: 70000 // Standard ERC20 transaction gas units
}

// Chain types for fee calculations
export enum ChainType {
  UTXO = 'utxo',
  EVM = 'evm',
  THOR = 'thor'
}

// Fee types
export interface InboundFee {
  amount: string
  chain: string
  gasRate: string
  txSize: number
}

export interface LiquidityFee {
  amount: string
  slip: string
  swapAmount: string
  poolDepth: string
}

export interface AffiliateFee {
  amount: string
  basisPoints: string
  swapAmount: string
}

export interface OutboundFee {
  amount: string
  chain: string
  gasRate: string
  txSize: number
  multiplier: string
}

// Combined fee structure
export interface ThorchainFees {
  inboundFee: InboundFee
  liquidityFee: LiquidityFee
  affiliateFee: AffiliateFee
  outboundFee: OutboundFee
  totalFeeInAsset: string
  totalFeeInUsd?: string
}

// Inbound address information from Thorchain API
export interface InboundAddressInfo {
  chain: string
  pub_key: string
  address: string
  router?: string
  halted: boolean
  global_trading_paused: boolean
  chain_trading_paused: boolean
  chain_lp_actions_paused: boolean
  gas_rate: string
  gas_rate_units: string
  outbound_tx_size: string
  outbound_fee: string
  dust_threshold: string
}

/**
 * Calculate affiliate fee based on basis points
 *
 * @param swapAmount Amount being swapped
 * @param basisPoints Fee in basis points (0-10,000)
 * @returns Affiliate fee amount
 */
export function calculateAffiliateFee(swapAmount: string, basisPoints: string): string {
  // Fee = swapAmount * basisPoints / 10000
  return div(mul(swapAmount, basisPoints), BASIS_POINTS_DIVISOR, FEE_PRECISION)
}

/**
 * Calculate liquidity fee based on slip formula
 *
 * slip = swapAmount / (swapAmount + poolDepth)
 * fee = slip * swapAmount
 *
 * @param swapAmount Amount being swapped
 * @param poolDepth Depth of the pool
 * @returns Liquidity fee amount
 */
export function calculateLiquidityFee(swapAmount: string, poolDepth: string): { slip: string; fee: string } {
  // Calculate slip = swapAmount / (swapAmount + poolDepth)
  const denominator = mul('1', poolDepth) // Ensure we're working with a copy
  const slip = div(swapAmount, denominator, FEE_PRECISION)

  // Calculate fee = slip * swapAmount
  const fee = mul(slip, swapAmount)

  return { slip, fee }
}

/**
 * Get chain type based on plugin ID
 *
 * @param pluginId Edge currency plugin ID
 * @returns Chain type for fee calculations
 */
export function getChainType(pluginId: string): ChainType {
  if (pluginId === 'ethereum' || pluginId === 'binancesmartchain' || pluginId === 'avalanche') {
    return ChainType.EVM
  }

  if (pluginId === 'bitcoin' || pluginId === 'bitcoincash' || pluginId === 'litecoin' || pluginId === 'dogecoin') {
    return ChainType.UTXO
  }

  if (pluginId === 'thorchain') {
    return ChainType.THOR
  }

  // Default to EVM as a safe fallback
  return ChainType.EVM
}

/**
 * Calculate inbound fee based on chain type
 *
 * @param chainType Type of blockchain
 * @param gasRate Gas rate from inbound_addresses endpoint
 * @returns Inbound fee amount
 */
export function calculateInboundFee(chainType: ChainType, gasRate: string): string {
  let txSize = 0

  switch (chainType) {
    case ChainType.UTXO:
      txSize = TX_SIZE.UTXO
      break
    case ChainType.EVM:
      txSize = TX_SIZE.ETH
      break
    case ChainType.THOR:
      return THORCHAIN_NATIVE_FEE
    default:
      txSize = TX_SIZE.ETH
  }

  return mul(gasRate, txSize.toString())
}

/**
 * Calculate outbound fee based on chain type and OFM
 *
 * @param chainType Type of blockchain
 * @param gasRate Gas rate from inbound_addresses endpoint
 * @param outboundFeeMultiplier Outbound Fee Multiplier from network
 * @param isToken Whether the asset is a token or native asset
 * @returns Outbound fee amount
 */
export function calculateOutboundFee(chainType: ChainType, gasRate: string, outboundFeeMultiplier: string, isToken: boolean = false): string {
  let txSize = 0

  switch (chainType) {
    case ChainType.UTXO:
      txSize = TX_SIZE.UTXO
      break
    case ChainType.EVM:
      txSize = isToken ? TX_SIZE.ERC20 : TX_SIZE.ETH
      break
    case ChainType.THOR:
      return THORCHAIN_NATIVE_FEE
    default:
      txSize = isToken ? TX_SIZE.ERC20 : TX_SIZE.ETH
  }

  // outboundFee = gasRate * txSize * outboundFeeMultiplier
  const baseOutboundFee = mul(gasRate, txSize.toString())
  return mul(baseOutboundFee, outboundFeeMultiplier)
}

/**
 * Interface for the parameters needed to calculate Thorchain fees
 */
export interface CalculateThorchainFeesParams {
  sourceChain: string
  destinationChain: string
  swapAmount: string
  poolDepth: string
  isDestinationToken: boolean
  affiliateFeeBps: string
  inboundAddresses: InboundAddressInfo[]
  outboundFeeMultiplier: string
}

/**
 * Calculate all Thorchain fees for a swap operation
 *
 * @param params Parameters for fee calculation
 * @returns Calculated fees for the swap
 */
export function calculateThorchainFees(params: CalculateThorchainFeesParams): ThorchainFees {
  const { sourceChain, destinationChain, swapAmount, poolDepth, isDestinationToken, affiliateFeeBps, inboundAddresses, outboundFeeMultiplier } = params

  // Find inbound address info for source and destination chains
  const sourceChainInfo = inboundAddresses.find(info => info.chain.toLowerCase() === sourceChain.toLowerCase())
  const destChainInfo = inboundAddresses.find(info => info.chain.toLowerCase() === destinationChain.toLowerCase())

  if (!sourceChainInfo || !destChainInfo) {
    throw new Error(`Chain information not found for ${sourceChain} or ${destinationChain}`)
  }

  // Get chain types for fee calculations
  const sourceChainType = getChainType(sourceChain)
  const destChainType = getChainType(destinationChain)

  // Calculate inbound fee
  const inboundFeeAmount = calculateInboundFee(sourceChainType, sourceChainInfo.gas_rate)
  const inboundFee: InboundFee = {
    amount: inboundFeeAmount,
    chain: sourceChain,
    gasRate: sourceChainInfo.gas_rate,
    txSize: parseInt(sourceChainInfo.outbound_tx_size, 10)
  }

  // Calculate liquidity fee
  const { slip, fee: liquidityFeeAmount } = calculateLiquidityFee(swapAmount, poolDepth)
  const liquidityFee: LiquidityFee = {
    amount: liquidityFeeAmount,
    slip,
    swapAmount,
    poolDepth
  }

  // Calculate affiliate fee
  const affiliateFeeAmount = calculateAffiliateFee(swapAmount, affiliateFeeBps)
  const affiliateFee: AffiliateFee = {
    amount: affiliateFeeAmount,
    basisPoints: affiliateFeeBps,
    swapAmount
  }

  // Calculate outbound fee
  const outboundFeeAmount = calculateOutboundFee(destChainType, destChainInfo.gas_rate, outboundFeeMultiplier, isDestinationToken)
  const outboundFee: OutboundFee = {
    amount: outboundFeeAmount,
    chain: destinationChain,
    gasRate: destChainInfo.gas_rate,
    txSize: parseInt(destChainInfo.outbound_tx_size, 10),
    multiplier: outboundFeeMultiplier
  }

  // Calculate total fee in asset
  const totalFeeInAsset = add(add(liquidityFeeAmount, affiliateFeeAmount), outboundFeeAmount)

  return {
    inboundFee,
    liquidityFee,
    affiliateFee,
    outboundFee,
    totalFeeInAsset
  }
}

/**
 * Calculate the minimum swap amount based on Thorchain documentation
 *
 * The minimum swappable amount should be the maximum of:
 * 1. The destination chain outbound_fee
 * 2. The source chain outbound_fee
 * 3. $1.00 (the minimum)
 *
 * Multiplied by a buffer (recommended 4x) to allow for sudden gas spikes
 *
 * @param sourceChain Source chain for the swap
 * @param destinationChain Destination chain for the swap
 * @param inboundAddresses Inbound addresses from Thorchain API
 * @param buffer Buffer multiplier (default 4)
 * @returns Minimum swap amount
 */
export function calculateMinimumSwapAmount(sourceChain: string, destinationChain: string, inboundAddresses: InboundAddressInfo[], buffer: number = 4): string {
  // Find inbound address info for source and destination chains
  const sourceChainInfo = inboundAddresses.find(info => info.chain.toLowerCase() === sourceChain.toLowerCase())
  const destChainInfo = inboundAddresses.find(info => info.chain.toLowerCase() === destinationChain.toLowerCase())

  if (!sourceChainInfo || !destChainInfo) {
    throw new Error(`Chain information not found for ${sourceChain} or ${destinationChain}`)
  }

  // Get outbound fees for source and destination chains
  const sourceOutboundFee = sourceChainInfo.outbound_fee
  const destOutboundFee = destChainInfo.outbound_fee

  // Convert $1.00 to asset units (simplified - in production this would use price data)
  // For now we'll just use a placeholder value in the asset's base units
  const minUsdInAsset = MIN_USD_FEE

  // Find the maximum of the three values
  let maxFee = minUsdInAsset
  if (gt(sourceOutboundFee, maxFee)) {
    maxFee = sourceOutboundFee
  }
  if (gt(destOutboundFee, maxFee)) {
    maxFee = destOutboundFee
  }

  // Apply buffer
  return mul(maxFee, buffer.toString())
}

/**
 * Check if a swap amount is above the minimum required amount
 *
 * @param swapAmount Amount to swap
 * @param minAmount Minimum required amount
 * @returns True if the swap amount is sufficient
 */
export function isSwapAmountSufficient(swapAmount: string, minAmount: string): boolean {
  return !lt(swapAmount, minAmount)
}
