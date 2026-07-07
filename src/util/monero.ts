import { asBoolean, asObject, asOptional, asString } from 'cleaners'

export const asMoneroUserSettings = asObject({
  enableCustomServers: asBoolean,
  enableCustomMonerod: asOptional(asBoolean, false),
  moneroLightwalletServer: asString,
  monerodServer: asOptional(asString, '')
})
export type MoneroUserSettings = ReturnType<typeof asMoneroUserSettings>

/**
 * Imported Monero wallets are not allowed to use Edge's own LWS server: each
 * watched wallet incurs an ongoing address-scanning cost on the server side.
 * A user-configured *custom* LWS server is fine. Returns true when the account
 * is currently pointed at an Edge-operated LWS server.
 */
export const isMoneroEdgeLws = (userSettings: MoneroUserSettings): boolean => {
  const { enableCustomServers, moneroLightwalletServer } = userSettings
  if (!enableCustomServers) return true
  try {
    return /^monerolws\d+\.edge\.app$/i.test(
      new URL(moneroLightwalletServer).hostname
    )
  } catch {
    // An unparseable custom URL is treated as a custom (non-Edge) server.
    return false
  }
}
