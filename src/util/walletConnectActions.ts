import {
  asArray,
  asBoolean,
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type { EdgeCurrencyConfig } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatNumber, toLocaleDateTime } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { getExchangeDenom } from '../selectors/DenominationSelectors'
import { convertNativeToDenomination, truncateString } from './utils'

// A currency a request refers to. The chain's own coin has no
// `contractAddress`, and the plugin only sends a `tokenId` for tokens
// the wallet knows:
const asTokenRef = {
  contractAddress: asOptional(asString),
  tokenId: asOptional(asString)
}

// One value an ERC-7730 descriptor says to show, already formatted:
const asWcIntentField = asObject({
  label: asString,
  value: asString,
  // Set when the value is an address:
  address: asOptional(asString),
  // Set when the value is a raw amount of a token the wallet does not know:
  tokenAddress: asOptional(asString)
})

/**
 * One thing a WalletConnect request asks the wallet to sign or do,
 * as the wallet's currency plugin describes it.
 */
export const asWcAction = asEither(
  asObject({
    type: asValue<['signText']>('signText'),
    text: asString
  }),
  asObject({
    type: asValue<['signBytes']>('signBytes'),
    hex: asString,
    byteLength: asNumber
  }),
  asObject({
    type: asValue<['signIn']>('signIn'),
    domain: asString,
    address: asString,
    statement: asOptional(asString),
    uri: asString,
    chainId: asString,
    expirationTime: asOptional(asString)
  }),
  asObject({
    type: asValue<['approve']>('approve'),
    ...asTokenRef,
    owner: asOptional(asString),
    spender: asString,
    nativeAmount: asString,
    unlimited: asBoolean,
    // When the allowance ends, in Unix seconds:
    expiration: asOptional(asNumber),
    oneTime: asOptional(asBoolean, false)
  }),
  asObject({
    type: asValue<['transfer']>('transfer'),
    ...asTokenRef,
    from: asString,
    to: asString,
    nativeAmount: asString,
    expiration: asOptional(asNumber)
  }),
  asObject({
    type: asValue<['approveAll']>('approveAll'),
    contractAddress: asString,
    operator: asString,
    approved: asBoolean
  }),
  asObject({
    type: asValue<['contractCall']>('contractCall'),
    // Missing when the call creates a contract:
    contractAddress: asOptional(asString),
    selector: asOptional(asString),
    functionName: asOptional(asString),
    // How much of the chain's own coin goes along:
    nativeAmount: asString
  }),
  asObject({
    type: asValue<['signTypedData']>('signTypedData'),
    primaryType: asString,
    domainName: asOptional(asString),
    contractAddress: asOptional(asString)
  }),
  asObject({
    // What a call or message does, according to the ERC-7730
    // descriptor its contract publishes:
    type: asValue<['intent']>('intent'),
    intent: asString,
    // A sentence with the values filled in:
    summary: asOptional(asString),
    fields: asArray(asWcIntentField),
    contractAddress: asString,
    contractName: asOptional(asString),
    owner: asOptional(asString),
    nativeAmount: asString
  })
)
export type WcAction = ReturnType<typeof asWcAction>
export type WcIntentField = ReturnType<typeof asWcIntentField>

export const asWcWarning = asEither(
  asObject({
    code: asValue<['wrongChain']>('wrongChain'),
    chainId: asString
  }),
  asObject({
    code: asValue<['wrongAddress']>('wrongAddress'),
    address: asString
  }),
  asObject({ code: asValue<['unreadable']>('unreadable') }),
  asObject({ code: asValue<['truncated']>('truncated') })
)
export type WcWarning = ReturnType<typeof asWcWarning>

/**
 * A titled list of the fields a signature covers.
 */
export const asWcDetails = asObject({
  title: asString,
  rows: asArray(asObject({ name: asString, value: asString }))
})
export type WcDetails = ReturnType<typeof asWcDetails>

/**
 * Something that would leave the wallet (a negative amount) or enter it.
 */
export const asWcAssetChange = asObject({
  ...asTokenRef,
  nativeAmount: asString,
  // Which NFT this is, for a token that is one:
  nftId: asOptional(asString),
  // What a token the wallet does not know calls itself.
  // Anyone can give a token any name:
  symbol: asOptional(asString),
  decimals: asOptional(asNumber)
})
export type WcAssetChange = ReturnType<typeof asWcAssetChange>

/**
 * What a request would do if it ran right now, according to the network.
 */
export const asWcSimulation = asObject({
  success: asBoolean,
  error: asOptional(asString),
  // Missing when the network can only say whether the request succeeds:
  assetChanges: asOptional(asArray(asWcAssetChange)),
  // The allowances the request would leave in place:
  approvals: asOptional(asArray(asWcAction), () => [])
})
export type WcSimulation = ReturnType<typeof asWcSimulation>

/**
 * The description a plugin may add to its parsed WalletConnect payload.
 */
export const asWcRequestDescription = asObject({
  actions: asOptional(asArray(asWcAction)),
  warnings: asOptional(asArray(asWcWarning)),
  details: asOptional(asArray(asWcDetails))
})

interface DescribeOpts {
  currencyConfig: EdgeCurrencyConfig
  /** The address the session gave the dapp for this wallet. */
  walletAddress?: string
  /** Where the request came from, as far as WalletConnect can tell. */
  dAppOrigin?: string
}

/**
 * Describes one action as a row title and body.
 * A risky action is one to draw the user's eye to.
 */
export function describeWcAction(
  action: WcAction,
  opts: DescribeOpts
): { title: string; body: string | undefined; isRisky: boolean } {
  const { currencyConfig, walletAddress } = opts
  const name = (address: string): string =>
    walletAddress != null && sameAddress(address, walletAddress)
      ? lstrings.wc_this_wallet
      : shortAddress(address)

  switch (action.type) {
    case 'signText':
      return {
        title: lstrings.wc_sign_message_message,
        body: action.text,
        isRisky: false
      }

    case 'signBytes': {
      // The plugin only sends the start of long data:
      const isCut = action.hex.length < 2 + 2 * action.byteLength
      return {
        title: lstrings.wc_action_data,
        body: [
          isCut ? action.hex + lstrings.util_truncate_delimeter : action.hex,
          sprintf(lstrings.wc_action_bytes_1s, String(action.byteLength))
        ].join('\n'),
        isRisky: true
      }
    }

    case 'signIn': {
      const lines = [sprintf(lstrings.wc_action_sign_in_1s, action.domain)]
      if (action.statement != null) lines.push(action.statement)
      if (action.expirationTime != null) {
        const date = new Date(action.expirationTime)
        lines.push(
          sprintf(
            lstrings.wc_action_until_1s,
            isNaN(date.valueOf())
              ? action.expirationTime
              : toLocaleDateTime(date)
          )
        )
      }
      return {
        title: lstrings.wc_action_sign_in,
        body: lines.join('\n'),
        isRisky: false
      }
    }

    case 'approve': {
      const spender = name(action.spender)
      if (action.nativeAmount === '0') {
        return {
          title: lstrings.wc_action_approve,
          body: sprintf(
            lstrings.wc_action_revoke_2s,
            spender,
            getTokenName(currencyConfig, action)
          ),
          isRisky: false
        }
      }
      const lines = [
        sprintf(
          lstrings.wc_action_approve_2s,
          spender,
          getAmountText(currencyConfig, action, action.unlimited)
        )
      ]
      const until =
        action.expiration == null
          ? undefined
          : toLocaleDateTime(new Date(1000 * action.expiration))
      if (action.oneTime) {
        lines.push(
          until == null
            ? lstrings.wc_action_one_time
            : sprintf(lstrings.wc_action_one_time_until_1s, until)
        )
      } else {
        lines.push(
          until == null
            ? lstrings.wc_action_no_expiration
            : sprintf(lstrings.wc_action_until_1s, until)
        )
      }
      return {
        title: lstrings.wc_action_approve,
        body: lines.join('\n'),
        isRisky: action.unlimited
      }
    }

    case 'transfer': {
      const amount = getAmountText(currencyConfig, action, false)
      const isOurs =
        walletAddress != null && sameAddress(action.from, walletAddress)
      const lines = [
        isOurs
          ? sprintf(lstrings.wc_amount_to_2s, amount, name(action.to))
          : sprintf(
              lstrings.wc_amount_from_to_3s,
              amount,
              name(action.from),
              name(action.to)
            )
      ]
      if (action.expiration != null) {
        lines.push(
          sprintf(
            lstrings.wc_action_until_1s,
            toLocaleDateTime(new Date(1000 * action.expiration))
          )
        )
      }
      return {
        title: lstrings.wc_action_transfer,
        body: lines.join('\n'),
        isRisky: false
      }
    }

    case 'approveAll':
      return {
        title: lstrings.wc_action_approve_all,
        body: sprintf(
          action.approved
            ? lstrings.wc_action_approve_all_2s
            : lstrings.wc_action_revoke_all_2s,
          name(action.operator),
          shortAddress(action.contractAddress)
        ),
        isRisky: action.approved
      }

    case 'contractCall': {
      const { contractAddress, functionName, nativeAmount, selector } = action
      const lines: string[] = []
      if (contractAddress == null) {
        lines.push(lstrings.wc_action_create_contract)
      } else if (functionName != null || selector != null) {
        lines.push(
          sprintf(
            lstrings.wc_action_call_2s,
            functionName ?? selector,
            shortAddress(contractAddress)
          )
        )
      } else {
        lines.push(shortAddress(contractAddress))
      }
      if (nativeAmount !== '0') {
        lines.push(
          sprintf(
            lstrings.wc_action_call_value_1s,
            getAmountText(
              currencyConfig,
              { contractAddress: undefined, tokenId: undefined, nativeAmount },
              false
            )
          )
        )
      }
      return {
        title: lstrings.wc_action_contract_call,
        body: lines.join('\n'),
        isRisky: false
      }
    }

    case 'signTypedData':
      return {
        title: lstrings.wc_action_typed_data,
        body:
          action.domainName == null
            ? action.primaryType
            : sprintf(
                lstrings.wc_action_typed_data_2s,
                action.primaryType,
                action.domainName
              ),
        isRisky: false
      }

    case 'intent': {
      const { contractAddress, contractName, nativeAmount, owner } = action
      const lines: string[] = []
      if (action.summary != null) lines.push(action.summary)
      lines.push(
        contractName != null && owner != null
          ? sprintf(lstrings.wc_action_intent_contract_2s, contractName, owner)
          : contractName ?? owner ?? shortAddress(contractAddress)
      )
      if (nativeAmount !== '0') {
        lines.push(
          sprintf(
            lstrings.wc_action_call_value_1s,
            getAmountText(
              currencyConfig,
              { contractAddress: undefined, tokenId: undefined, nativeAmount },
              false
            )
          )
        )
      }
      return {
        title: capitalize(action.intent),
        body: lines.join('\n'),
        isRisky: false
      }
    }
  }
}

/**
 * Describes one value an ERC-7730 descriptor shows, as a row title and body.
 */
export function describeWcIntentField(
  field: WcIntentField,
  opts: DescribeOpts
): { title: string; body: string } {
  const { walletAddress } = opts
  const { address, label, tokenAddress, value } = field

  // Without the token we do not know the decimals, so show the raw amount:
  if (tokenAddress != null) {
    return {
      title: label,
      body: sprintf(
        lstrings.wc_unknown_token_amount_2s,
        formatNumber(value),
        shortAddress(tokenAddress)
      )
    }
  }
  if (
    address != null &&
    walletAddress != null &&
    sameAddress(address, walletAddress)
  ) {
    return { title: label, body: lstrings.wc_this_wallet }
  }
  return { title: label, body: value }
}

/**
 * Describes one simulated balance change as a row title and body.
 */
export function describeWcAssetChange(
  change: WcAssetChange,
  opts: DescribeOpts
): { title: string; body: string } {
  const { currencyConfig } = opts
  const { contractAddress, decimals, nftId, symbol, tokenId } = change
  const isSend = change.nativeAmount.startsWith('-')
  const nativeAmount = change.nativeAmount.replace(/^-/, '')
  const title = isSend ? lstrings.wc_sim_send : lstrings.wc_sim_receive

  if (nftId != null && contractAddress != null) {
    const collection = shortAddress(contractAddress)
    return {
      title,
      body:
        nativeAmount === '1'
          ? sprintf(lstrings.wc_sim_nft_2s, nftId, collection)
          : sprintf(
              lstrings.wc_sim_nft_count_3s,
              formatNumber(nativeAmount),
              nftId,
              collection
            )
    }
  }

  // A token the wallet does not know, going by what it says about itself.
  // The contract address stays in view, since the name proves nothing:
  const isKnown = tokenId != null && currencyConfig.allTokens[tokenId] != null
  if (contractAddress != null && !isKnown && decimals != null) {
    const amount = formatNumber(
      convertNativeToDenomination('1' + '0'.repeat(decimals))(nativeAmount)
    )
    const token = shortAddress(contractAddress)
    return {
      title,
      body:
        symbol == null
          ? sprintf(lstrings.wc_sim_token_amount_2s, amount, token)
          : sprintf(
              lstrings.wc_sim_named_token_amount_3s,
              amount,
              symbol,
              token
            )
    }
  }

  return {
    title,
    body: getAmountText(
      currencyConfig,
      { contractAddress, tokenId, nativeAmount },
      false
    )
  }
}

/**
 * Lists the reasons to distrust a request: the ones the plugin found,
 * plus the ones that depend on who is asking.
 */
export function getWcRisks(
  actions: WcAction[],
  warnings: WcWarning[],
  opts: DescribeOpts
): string[] {
  const { currencyConfig, dAppOrigin } = opts
  const out: string[] = []

  for (const action of actions) {
    if (action.type === 'approve' && action.unlimited) {
      out.push(
        sprintf(
          lstrings.wc_warning_unlimited_2s,
          shortAddress(action.spender),
          getTokenName(currencyConfig, action)
        )
      )
    }
    if (action.type === 'approveAll' && action.approved) {
      out.push(
        sprintf(
          lstrings.wc_warning_approve_all_2s,
          shortAddress(action.operator),
          shortAddress(action.contractAddress)
        )
      )
    }

    // A sign-in for one site, requested by another, is how a phishing
    // site borrows the user's login somewhere else:
    if (action.type === 'signIn' && dAppOrigin != null) {
      const host = getHost(dAppOrigin)
      if (host != null && host !== action.domain.toLowerCase()) {
        out.push(
          sprintf(lstrings.wc_warning_sign_in_origin_2s, action.domain, host)
        )
      }
    }
  }

  for (const warning of warnings) {
    switch (warning.code) {
      case 'wrongChain':
        out.push(sprintf(lstrings.wc_warning_wrong_chain_1s, warning.chainId))
        break
      case 'wrongAddress':
        out.push(
          sprintf(
            lstrings.wc_warning_wrong_address_1s,
            shortAddress(warning.address)
          )
        )
        break
      case 'unreadable':
        out.push(lstrings.wc_warning_unreadable)
        break
      case 'truncated':
        out.push(lstrings.wc_warning_truncated)
        break
    }
  }
  // The decoder and the simulation can both report one approval:
  return [...new Set(out)]
}

/**
 * Extracts the host and port from a URL, without the user name a
 * misleading URL could put in front of them.
 */
function getHost(url: string): string | undefined {
  const match = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#@]*@)?([^/?#@]+)/i.exec(url)
  return match?.[1].toLowerCase()
}

const sameAddress = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()

// Descriptors write their intents in whatever case they like:
const capitalize = (text: string): string =>
  text.slice(0, 1).toUpperCase() + text.slice(1)

const shortAddress = (address: string): string =>
  truncateString(address, 12, true)

interface TokenRef {
  contractAddress: string | undefined
  tokenId: string | undefined
}

function getTokenName(
  currencyConfig: EdgeCurrencyConfig,
  token: TokenRef
): string {
  const { contractAddress, tokenId } = token
  if (contractAddress == null) return currencyConfig.currencyInfo.currencyCode
  const edgeToken =
    tokenId == null ? undefined : currencyConfig.allTokens[tokenId]
  return edgeToken != null
    ? edgeToken.currencyCode
    : sprintf(lstrings.wc_token_address_1s, shortAddress(contractAddress))
}

function getAmountText(
  currencyConfig: EdgeCurrencyConfig,
  token: TokenRef & { nativeAmount: string },
  unlimited: boolean
): string {
  const { contractAddress, nativeAmount } = token
  if (unlimited) {
    return sprintf(
      lstrings.wc_amount_unlimited_1s,
      getTokenName(currencyConfig, token)
    )
  }
  // The chain's own coin has no token ID:
  const tokenId = contractAddress == null ? null : token.tokenId
  // Without the token we do not know the decimals, so show the raw amount:
  if (
    contractAddress != null &&
    (tokenId == null || currencyConfig.allTokens[tokenId] == null)
  ) {
    return sprintf(
      lstrings.wc_unknown_token_amount_2s,
      formatNumber(nativeAmount),
      shortAddress(contractAddress)
    )
  }
  const { multiplier, name } = getExchangeDenom(currencyConfig, tokenId ?? null)
  const amount = convertNativeToDenomination(multiplier)(nativeAmount)
  return `${formatNumber(amount)} ${name}`
}
