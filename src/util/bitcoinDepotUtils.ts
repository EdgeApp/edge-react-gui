import type { EdgeAccount } from 'edge-core-js'

/**
 * The referral/affiliate ID auto-assigned to detected BitcoinDepot
 * whitelabel users.
 */
export const BITCOIN_DEPOT_INSTALLER_ID = 'bitcoindepot'

/**
 * Wallets created by the BitcoinDepot whitelabel app carry its login
 * appId in their `appIds` list. Match by substring so minor appId
 * variations (e.g. nested appIds) still detect.
 */
const BITCOIN_DEPOT_APP_ID_MATCH = 'bitcoindepot'

/**
 * Detects BitcoinDepot whitelabel users by examining the account's wallets.
 * Returns true if any non-deleted wallet was created under the BitcoinDepot
 * login appId.
 */
export function hasBitcoinDepotWallets(account: EdgeAccount): boolean {
  return account.allKeys.some(
    walletInfo =>
      !walletInfo.deleted &&
      walletInfo.appIds.some(appId =>
        appId.toLowerCase().includes(BITCOIN_DEPOT_APP_ID_MATCH)
      )
  )
}
