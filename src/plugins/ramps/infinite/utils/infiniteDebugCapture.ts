// =============================================================================
// TEST/DEBUG-BUILD ONLY — diagnosing Infinite (ramp) request failures.
//
// Purpose: a QA tester hit an Infinite error that surfaced only as a generic
// `HTTP error! status: ...`, hiding the real cause. This module surfaces the
// real failing request/response and captures the minimal Infinite session auth
// needed to replay the exact failing call from a local dev environment.
//
// SECURITY: the `replay-auth` log block contains the tester's Infinite Bearer
// token AND the wallet-derived private key. It is ONLY ever written to console
// logs (never committed, never transmitted) and must be shared only with the
// Edge dev team. This module must NOT ship in a production build.
// =============================================================================

export const INFINITE_DEBUG_TAG = '[INFINITE-DEBUG]'

// Wallet key material lives in the plugin layer; the failure logger runs in the
// API layer. This module-level store lets the plugin feed the wallet pieces to
// the logger so a single failure emits a complete replay blob.
export interface InfiniteDebugAuthContext {
  orgId?: string
  apiUrl?: string
  publicKey?: string
  privateKeyHex?: string
}

let debugAuthContext: InfiniteDebugAuthContext = {}

export const setInfiniteDebugAuthContext = (
  context: Partial<InfiniteDebugAuthContext>
): void => {
  debugAuthContext = { ...debugAuthContext, ...context }
}

export const getInfiniteDebugAuthContext = (): InfiniteDebugAuthContext =>
  debugAuthContext

const MAX_BODY_LENGTH = 4000

const truncate = (text: string): string =>
  text.length > MAX_BODY_LENGTH
    ? `${text.slice(0, MAX_BODY_LENGTH)}…[truncated ${
        text.length - MAX_BODY_LENGTH
      } chars]`
    : text

// Redact the Bearer token for the (tester-shareable) request log. The real
// token is emitted separately in the SENSITIVE replay-auth block.
export const sanitizeHeaders = (
  headers?: HeadersInit
): Record<string, string> => {
  const out: Record<string, string> = {}
  if (headers == null) return out

  const entries =
    headers instanceof Headers
      ? [...headers.entries()]
      : Array.isArray(headers)
      ? headers
      : Object.entries(headers)

  for (const [key, value] of entries) {
    out[key] =
      key.toLowerCase() === 'authorization'
        ? 'Bearer <redacted>'
        : String(value)
  }
  return out
}

// In-app (UI-visible) error message. Includes the HTTP status and the raw
// response body so the tester can screenshot the real failure. Never contains
// the auth token or any wallet secret (those go to logs only).
export const buildInfiniteErrorMessage = (
  status: number,
  rawBody: string,
  detail?: string
): string => {
  const prefix = detail != null && detail !== '' ? `${detail} ` : ''
  return `${prefix}(HTTP ${status}) ${truncate(rawBody)}`
}

interface RequestFailureArgs {
  status: number
  rawBody: string
  url: string
  method: string
  requestBody?: BodyInit | null
  headers?: HeadersInit
  // Session auth known by the API layer:
  orgId: string
  apiUrl: string
  token: string | null
  customerId: string | null
  sessionId: string | null
}

// Unconditionally log the failing Infinite request and response, plus the
// session auth needed to replay it locally. NOT gated behind any env flag — the
// whole point of this build is that the failure is visible.
export const logInfiniteRequestFailure = (args: RequestFailureArgs): void => {
  const wallet = getInfiniteDebugAuthContext()

  console.log(
    `${INFINITE_DEBUG_TAG} Infinite request FAILED — copy every "${INFINITE_DEBUG_TAG}" line below and send it to the Edge team`
  )
  console.log(`${INFINITE_DEBUG_TAG} request`, {
    method: args.method,
    url: args.url,
    body: args.requestBody != null ? truncate(String(args.requestBody)) : null,
    headers: sanitizeHeaders(args.headers)
  })
  console.log(`${INFINITE_DEBUG_TAG} response`, {
    status: args.status,
    body: truncate(args.rawBody)
  })
  console.log(
    `${INFINITE_DEBUG_TAG} replay-auth (SENSITIVE: contains Bearer token + wallet private key)`,
    {
      orgId: args.orgId,
      apiUrl: args.apiUrl,
      token: args.token,
      customerId: args.customerId,
      sessionId: args.sessionId,
      publicKey: wallet.publicKey,
      privateKeyHex: wallet.privateKeyHex
    }
  )
}
