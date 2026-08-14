/**
 * Secrets that must stay in the on-device `keys.json` and must never be taken
 * from a remote getKeys overlay. Kept in a React-Native-free module so build
 * scripts (`slimKeysJson`) and the runtime store share one inventory.
 */
export const LOCAL_ONLY_TOP_LEVEL = [
  'EDGE_API_KEY',
  'EDGE_API_SECRET',
  'BUGSNAG_API_KEY',
  // Telemetry credential read at module scope; the server never serves it and
  // an overlay must never rotate it. It lives top-level on KEYS.
  'POSTHOG_API_KEY'
] as const

export const LOCAL_ONLY_PREFIXES = ['SENTRY_'] as const
