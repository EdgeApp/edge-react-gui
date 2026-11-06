import {
  asBoolean,
  asEither,
  asMaybe,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

export const asInitOptions = asObject({
  /** The anchor's home domain, where its stellar.toml lives. */
  homeDomain: asOptional(asString, 'testanchor.stellar.org')
})

/** The SEP-1 stellar.toml fields this client needs. */
export interface AnchorToml {
  networkPassphrase: string
  signingKey: string
  transferServerSep24: string
  webAuthEndpoint: string
}

/** Where to reach one anchor, as saved with each transfer. */
export interface AnchorEndpoints {
  homeDomain: string
  signingKey: string
  transferServerSep24: string
  webAuthEndpoint: string
}

// SEP-10:

export const asSep10Challenge = asObject({
  transaction: asString,
  network_passphrase: asOptional(asString)
})

export const asSep10Token = asObject({
  token: asString
})

// SEP-24:

const asSep24AssetInfo = asObject({
  enabled: asBoolean,
  min_amount: asOptional(asNumber),
  max_amount: asOptional(asNumber)
})
export type Sep24AssetInfo = ReturnType<typeof asSep24AssetInfo>

export const asSep24Info = asObject({
  deposit: asObject(asSep24AssetInfo),
  withdraw: asObject(asSep24AssetInfo)
})
export type Sep24Info = ReturnType<typeof asSep24Info>

export const asSep24Interactive = asObject({
  type: asString,
  url: asString,
  id: asString
})

export const asSep24Transaction = asObject({
  id: asString,
  kind: asValue('deposit', 'withdrawal'),
  status: asString,
  amount_in: asMaybe(asString),
  amount_out: asMaybe(asString),
  message: asMaybe(asString),
  more_info_url: asMaybe(asString),
  stellar_transaction_id: asMaybe(asString),
  withdraw_anchor_account: asMaybe(asString),
  withdraw_memo: asMaybe(asString),
  withdraw_memo_type: asMaybe(asValue('text', 'id', 'hash'))
})
export type Sep24Transaction = ReturnType<typeof asSep24Transaction>

export const asSep24TransactionResponse = asObject({
  transaction: asSep24Transaction
})

export const asSep24Error = asObject({
  error: asString
})

// Saved transfers:

export const asMoneygramTransfer = asObject({
  /** The anchor's SEP-24 transaction id */
  id: asString,
  direction: asValue('buy', 'sell'),
  walletId: asString,
  tokenId: asEither(asString, asNull),
  assetCode: asString,
  fiatCurrencyCode: asString,
  status: asString,
  createdAt: asString,
  /** The txid of the payment this wallet sent to the anchor */
  sendTxid: asOptional(asString),
  /** The txid this wallet tagged as the anchor's deposit */
  taggedTxid: asOptional(asString),
  anchor: asObject({
    homeDomain: asString,
    signingKey: asString,
    transferServerSep24: asString,
    webAuthEndpoint: asString
  })
})
export type MoneygramTransfer = ReturnType<typeof asMoneygramTransfer>
