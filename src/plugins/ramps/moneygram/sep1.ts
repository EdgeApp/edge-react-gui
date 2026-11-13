import URL from 'url-parse'

import type { AnchorCurrency, AnchorToml } from './moneygramTypes'
import { isHomeDomainHost } from './sep24Api'

/**
 * Reads the top-level string keys from a stellar.toml file.
 * Keys inside [SECTIONS] and [[TABLES]] are not needed by SEP-10 or SEP-24,
 * so parsing stops at the first table header.
 */
export function parseStellarToml(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of readTomlLines(text)) {
    if (line.startsWith('[')) break
    addTomlKey(out, line)
  }
  return out
}

/**
 * Reads the code and issuer of each [[CURRENCIES]] entry, which names the
 * assets the anchor issues or pays out.
 */
export function parseTomlCurrencies(text: string): AnchorCurrency[] {
  const tables: Array<Record<string, string>> = []
  let table: Record<string, string> | undefined
  for (const line of readTomlLines(text)) {
    if (line.startsWith('[')) {
      table = line === '[[CURRENCIES]]' ? {} : undefined
      if (table != null) tables.push(table)
      continue
    }
    if (table != null) addTomlKey(table, line)
  }

  const out: AnchorCurrency[] = []
  for (const { code, issuer } of tables) {
    if (code != null) out.push({ code, issuer })
  }
  return out
}

/** The trimmed lines of a TOML file, without blanks or comments. */
function readTomlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#'))
}

/** Adds a `KEY = "value"` line to the table, if it holds a string. */
function addTomlKey(table: Record<string, string>, line: string): void {
  const match = /^([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line)
  if (match == null) return
  const value = readTomlString(match[2])
  if (value != null) table[match[1]] = value
}

/** Reads a quoted TOML string, ignoring any trailing comment. */
function readTomlString(text: string): string | undefined {
  const quote = text[0]
  if (quote !== '"' && quote !== "'") return
  const end = text.indexOf(quote, 1)
  if (end < 0) return
  return text.slice(1, end)
}

/** Picks and checks the SEP-10 / SEP-24 fields from parsed stellar.toml. */
export function asAnchorToml(
  fields: Record<string, string>,
  currencies: AnchorCurrency[],
  homeDomain: string
): AnchorToml {
  const pick = (key: string): string => {
    const value = fields[key]
    if (value == null || value === '') {
      throw new Error(`${homeDomain} stellar.toml has no ${key}`)
    }
    return value
  }
  // The login and transfer servers get the wallet's SEP-10 token and
  // choose where withdrawals go, so they must sit on the home domain:
  const pickEndpoint = (key: string): string => {
    const value = pick(key)
    const { hostname, protocol } = new URL(value)
    if (protocol !== 'https:' || !isHomeDomainHost(hostname, homeDomain)) {
      throw new Error(`${homeDomain} stellar.toml ${key} is not on the domain`)
    }
    return value
  }
  return {
    currencies,
    networkPassphrase: pick('NETWORK_PASSPHRASE'),
    signingKey: pick('SIGNING_KEY'),
    transferServerSep24: pickEndpoint('TRANSFER_SERVER_SEP0024').replace(
      /\/+$/,
      ''
    ),
    webAuthEndpoint: pickEndpoint('WEB_AUTH_ENDPOINT')
  }
}

export async function fetchAnchorToml(homeDomain: string): Promise<AnchorToml> {
  const response = await fetch(`https://${homeDomain}/.well-known/stellar.toml`)
  if (!response.ok) {
    throw new Error(
      `${homeDomain} stellar.toml request failed: ${response.status}`
    )
  }
  const text = await response.text()
  return asAnchorToml(
    parseStellarToml(text),
    parseTomlCurrencies(text),
    homeDomain
  )
}
