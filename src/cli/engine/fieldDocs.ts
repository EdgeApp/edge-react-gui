/**
 * Field descriptions more than one route publishes.
 *
 * A `doc()` string is the published reference: it reaches the HTML, the
 * OpenAPI document and `edge-cli help`. So the same field described in two
 * places is the same hazard as two copies of a type — a reword in one gives
 * a caller two different descriptions of one field, and nothing fails when
 * they disagree, because `checkRouteContracts` only asserts that a
 * description *exists*.
 *
 * `'Defaults to the native asset.'` was written out twelve times across six
 * route files, with one of them already extracted locally as `TOKEN_ID_DOC`.
 *
 * No imports, so any route file can use it.
 */

/** A request-position `tokenId`, which is optional on every route. */
export const TOKEN_ID_DOC = 'Defaults to the native asset.'

/** The `walletId` every wallet route takes. */
export const WALLET_ID_DOC =
  'The wallet to act on. A full wallet id, or any unique prefix of one. An ' +
  'ambiguous prefix returns `409 AMBIGUOUS_WALLET_ID` with ' +
  '`details.candidates`.'

/** A spend's destination, in the convenience shorthand. */
export const SPEND_TO_DOC =
  'Address or BIP21 URI, run through `wallet.parseUri`.'

/** How much to send, in the convenience shorthand. */
export const SPEND_AMOUNT_DOC = 'How much, in native units.'

/** The alias the `to` shorthand accepts for `nativeAmount`. */
export const SPEND_AMOUNT_ALIAS_DOC = 'Alias of `nativeAmount`.'

/** Metadata supplied with a spend, against whatever the URI carried. */
export const SPEND_METADATA_DOC = 'Wins over anything parsed out of the URI.'

/** An object handle's id, as every schema that returns one describes it. */
export const OBJECT_ID_DOC =
  'Handle for the value the engine is holding. Pass it to the calls that consume it.'

/** The `kind` beside it, whose cleaner narrows but whose prose does not. */
export const OBJECT_KIND_DOC =
  'What the handle refers to, which decides the calls that accept it.'

/** The handle TTL, stated once so the number cannot be stated two ways. */
export const OBJECT_EXPIRES_DOC =
  'When the engine drops the handle. Handles live 5 minutes.'
