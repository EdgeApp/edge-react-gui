import { asArray, asJSON, asMaybe, asObject, asString } from 'cleaners'
import type { EdgeAccount, EdgeSpendTarget } from 'edge-core-js'

/**
 * The services that turn a name the user enters into an address. `plugin`
 * covers any other name the wallet's own currency plugin resolves.
 */
export type RecipientNameService =
  | 'fio'
  | 'ens'
  | 'unstoppable'
  | 'zns'
  | 'zano'
  | 'plugin'

/** A name the user typed, scanned or picked, with the service it belongs to. */
export interface RecipientName {
  service: RecipientNameService
  name: string
}

/** A send to a name, with the public address the name resolved to. */
export interface NameSend extends RecipientName {
  publicAddress: string
}

/**
 * A name the address tile resolved and the user accepted for one spend
 * target. `paidAddress` is the address the tile gave the target, which can be
 * a normalized form of the resolved `send.publicAddress` (an EVM checksum,
 * for one).
 */
export interface TileNameRecipient {
  paidAddress: string | undefined
  send: NameSend
}

const SENT_NAMES = 'SentNames.json'
const LEGACY_FIO_SENT_ADDRESSES = 'FioSentAddresses.json'

/**
 * Names this account has sent funds to, by service, each mapped to the public
 * addresses it resolved to at the time, keyed in lower case. Only sends whose
 * name the user entered and accepted write here, so a stranger cannot add a
 * name to it through an incoming request or transaction.
 */
const asSentNames = asJSON(
  asObject({
    names: asMaybe(asObject(asObject(asArray(asString))), {})
  })
)

/** The FIO-only list this one replaced, keyed by lower-cased FIO address. */
const asLegacyFioSentAddresses = asJSON(
  asObject({ addresses: asMaybe(asObject(asArray(asString)), {}) })
)

type SentNames = Record<string, Record<string, string[]>>

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/

/**
 * True when both strings are the same public address. EVM addresses are
 * hex, and their mixed-case checksum is optional: a name can resolve to the
 * checksummed form on one path and the lower-case form on another. Other
 * address formats can be case-sensitive, so they must match exactly.
 */
const isSameAddress = (known: string, address: string): boolean =>
  known === address ||
  (EVM_ADDRESS.test(known) && known.toLowerCase() === address.toLowerCase())

const includesAddress = (addresses: string[], address: string): boolean =>
  addresses.some(known => isSameAddress(known, address))

const readText = async (
  account: EdgeAccount,
  path: string
): Promise<string | undefined> =>
  await account.disklet.getText(path).catch(() => undefined)

const getSentNames = async (account: EdgeAccount): Promise<SentNames> => {
  const text = await readText(account, SENT_NAMES)
  // A copy, since the cleaner's fallback object is shared between reads:
  const sent: SentNames = { ...asMaybe(asSentNames)(text)?.names }

  // FIO sends recorded before this list covered every service:
  const legacyText = await readText(account, LEGACY_FIO_SENT_ADDRESSES)
  const legacy = asMaybe(asLegacyFioSentAddresses)(legacyText)?.addresses
  if (legacy != null) {
    const fio = { ...sent.fio }
    for (const [name, publicAddresses] of Object.entries(legacy)) {
      const known = fio[name] ?? []
      fio[name] = [
        ...known,
        ...publicAddresses.filter(address => !includesAddress(known, address))
      ]
    }
    sent.fio = fio
  }
  return sent
}

/**
 * True when this account has sent to the name while it resolved to this
 * public address. A name whose owner has since pointed it somewhere else
 * counts as new.
 */
export const hasSentToName = async (
  account: EdgeAccount,
  recipient: RecipientName,
  publicAddress: string
): Promise<boolean> => {
  const sent = await getSentNames(account)
  const publicAddresses =
    sent[recipient.service]?.[recipient.name.toLowerCase()]
  return (
    publicAddresses != null && includesAddress(publicAddresses, publicAddress)
  )
}

/**
 * The name sends a broadcast made that the user accepted in the address tile.
 * `tileRecipients` holds what the tile resolved for each target; a target's
 * `otherParams` are not consulted, because a caller such as an Edge Provider
 * `requestSpend` can fill them with anything. A target counts only while it
 * still pays the address the tile gave it. The recorded address is the one
 * the name resolved to, the same form the address tile checks against later.
 */
export const getAcceptedNameSends = (
  spendTargets: EdgeSpendTarget[],
  tileRecipients: WeakMap<EdgeSpendTarget, TileNameRecipient>
): NameSend[] => {
  const sends: NameSend[] = []
  for (const target of spendTargets) {
    const tileRecipient = tileRecipients.get(target)
    if (
      tileRecipient?.paidAddress != null &&
      tileRecipient.paidAddress === target.publicAddress
    ) {
      sends.push(tileRecipient.send)
    }
  }
  return sends
}

export const addToSentNames = async (
  account: EdgeAccount,
  sends: NameSend[]
): Promise<void> => {
  const sent = await getSentNames(account)
  let changed = false
  for (const { service, name, publicAddress } of sends) {
    const key = name.toLowerCase()
    const names = sent[service] ?? {}
    const publicAddresses = names[key] ?? []
    if (includesAddress(publicAddresses, publicAddress)) continue
    sent[service] = { ...names, [key]: [...publicAddresses, publicAddress] }
    changed = true
  }
  if (!changed) return
  await account.disklet.setText(SENT_NAMES, JSON.stringify({ names: sent }))
}
