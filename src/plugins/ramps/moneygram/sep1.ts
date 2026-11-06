import type { AnchorToml } from './moneygramTypes'

/**
 * Reads the top-level string keys from a stellar.toml file.
 * Keys inside [SECTIONS] and [[TABLES]] are not needed by SEP-10 or SEP-24,
 * so parsing stops at the first table header.
 */
export function parseStellarToml(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue
    if (line.startsWith('[')) break

    const match = /^([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match == null) continue
    const value = readTomlString(match[2])
    if (value != null) out[match[1]] = value
  }
  return out
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
  homeDomain: string
): AnchorToml {
  const pick = (key: string): string => {
    const value = fields[key]
    if (value == null || value === '') {
      throw new Error(`${homeDomain} stellar.toml has no ${key}`)
    }
    return value
  }
  return {
    networkPassphrase: pick('NETWORK_PASSPHRASE'),
    signingKey: pick('SIGNING_KEY'),
    transferServerSep24: pick('TRANSFER_SERVER_SEP0024').replace(/\/+$/, ''),
    webAuthEndpoint: pick('WEB_AUTH_ENDPOINT')
  }
}

export async function fetchAnchorToml(homeDomain: string): Promise<AnchorToml> {
  const response = await fetch(`https://${homeDomain}/.well-known/stellar.toml`)
  if (!response.ok) {
    throw new Error(
      `${homeDomain} stellar.toml request failed: ${response.status}`
    )
  }
  return asAnchorToml(parseStellarToml(await response.text()), homeDomain)
}
