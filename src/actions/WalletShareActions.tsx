import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgePendingWalletShare,
  EdgeWalletShareSpec
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { ScanModal } from '../components/modals/ScanModal'
import {
  type WalletShareChoice,
  WalletShareChooserModal
} from '../components/modals/WalletShareChooserModal'
import { WalletShareConfirmModal } from '../components/modals/WalletShareConfirmModal'
import { WalletShareModeModal } from '../components/modals/WalletShareModeModal'
import {
  type ReceivedWalletEntry,
  WalletShareReceivedModal
} from '../components/modals/WalletShareReceivedModal'
import { WalletShareReceiveModal } from '../components/modals/WalletShareReceiveModal'
import { WalletShareSelectModal } from '../components/modals/WalletShareSelectModal'
import {
  Airship,
  showError,
  showToast,
  showToastSpinner
} from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { parseDeepLink } from '../util/DeepLinkParser'

/**
 * Entry point from the wallet list header: pick a side, then run it.
 */
export async function startWalletShare(account: EdgeAccount): Promise<void> {
  const choice = await Airship.show<WalletShareChoice | undefined>(bridge => (
    <WalletShareChooserModal bridge={bridge} />
  ))
  if (choice === 'share') await scanForWalletShare(account)
  else if (choice === 'receive') await receiveSharedWallets(account)
}

/**
 * The sharer scans the recipient's QR. Anything that parses as a share link
 * is routed the same way the side-menu scanner would route it.
 */
async function scanForWalletShare(account: EdgeAccount): Promise<void> {
  const result = await Airship.show<string | undefined>(bridge => (
    <ScanModal
      bridge={bridge}
      scanModalTitle={lstrings.wallet_share_scan_title}
      textModalTitle={lstrings.wallet_share_scan_text_title}
      textModalHint={lstrings.wallet_share_scan_text_hint}
      textModalAutoFocus
    />
  ))
  if (result == null) return

  let link
  try {
    link = parseDeepLink(result)
  } catch {
    showError(lstrings.wallet_share_invalid_link)
    return
  }
  if (link.type === 'walletShareRequest') {
    await shareWalletsToLobby(account, link.lobbyId)
  } else if (link.type === 'walletShareOffer') {
    await acceptOfferedWallets(account, link.lobbyId)
  } else {
    showError(lstrings.wallet_share_invalid_link)
  }
}

/**
 * Answer a `request-wallets` lobby: select → modes → confirm → approve.
 * Cancelling any step abandons the whole flow.
 */
export async function shareWalletsToLobby(
  account: EdgeAccount,
  lobbyId: string
): Promise<void> {
  const wallets = await Airship.show<EdgeCurrencyWallet[] | undefined>(
    bridge => <WalletShareSelectModal bridge={bridge} />
  )
  if (wallets == null || wallets.length === 0) return

  const specs = await Airship.show<EdgeWalletShareSpec[] | undefined>(
    bridge => <WalletShareModeModal bridge={bridge} wallets={wallets} />
  )
  if (specs == null) return

  const confirmed = await Airship.show<true | undefined>(bridge => (
    <WalletShareConfirmModal
      bridge={bridge}
      wallets={wallets}
      specs={specs}
      onConfirm={async () => {
        await account.approveWalletShare(lobbyId, specs)
      }}
    />
  ))
  if (confirmed !== true) return

  showToast(sprintf(lstrings.wallet_share_shared_toast_1s, specs.length))
}

/**
 * Open a `request-wallets` lobby, show its QR, and wait for keys to arrive.
 */
export async function receiveSharedWallets(
  account: EdgeAccount
): Promise<void> {
  let pending: EdgePendingWalletShare
  try {
    pending = await account.requestWalletShare()
  } catch (error: unknown) {
    showError(error)
    return
  }
  await awaitPendingShare(account, pending, true)
}

/**
 * Answer a `share-wallets` lobby. The other side chose everything already,
 * so the only question is whether we want the wallets at all.
 */
export async function acceptOfferedWallets(
  account: EdgeAccount,
  lobbyId: string
): Promise<void> {
  const answer = await Airship.show<'accept' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.wallet_share_accept_title}
      message={lstrings.wallet_share_accept_body}
      buttons={{ accept: { label: lstrings.wallet_share_accept_button } }}
    />
  ))
  if (answer !== 'accept') return

  let pending: EdgePendingWalletShare
  try {
    pending = await account.acceptWalletShare(lobbyId)
  } catch (error: unknown) {
    showError(error)
    return
  }
  await awaitPendingShare(account, pending, false)
}

/**
 * Wait for a receiving-side share to finish, then show what arrived.
 */
async function awaitPendingShare(
  account: EdgeAccount,
  pending: EdgePendingWalletShare,
  showQr: boolean
): Promise<void> {
  const walletIds = await Airship.show<string[] | undefined>(bridge => (
    <WalletShareReceiveModal
      bridge={bridge}
      pending={pending}
      showQr={showQr}
    />
  ))
  if (walletIds == null || walletIds.length === 0) return

  // The keys are attached, but the wallets take a moment to boot. Wait for
  // them so the list can show real names rather than placeholders:
  const modeById = new Map<string, EdgeWalletShareSpec['mode']>()
  for (const spec of pending.sharedWallets ?? []) {
    modeById.set(spec.walletId, spec.mode)
  }
  const entries = await showToastSpinner(
    lstrings.wallet_share_receive_waiting,
    Promise.all(
      walletIds.map(async (walletId): Promise<ReceivedWalletEntry> => {
        const wallet = await account.waitForCurrencyWallet(walletId)
        return {
          wallet,
          mode:
            modeById.get(walletId) ?? (wallet.canSign ? 'spend' : 'viewOnly')
        }
      })
    )
  )

  await Airship.show(bridge => (
    <WalletShareReceivedModal bridge={bridge} entries={entries} />
  ))
}
