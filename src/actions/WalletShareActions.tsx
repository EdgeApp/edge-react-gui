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
import {
  editWalletShareNickname,
  ensureWalletShareNickname
} from './WalletShareNickname'

/**
 * Entry point from the wallet list header: name this device, pick a side,
 * then run it.
 *
 * The nickname is asked for once and remembered, so the chooser is the first
 * thing a returning user sees.
 */
export async function startWalletShare(account: EdgeAccount): Promise<void> {
  let nickname: string | undefined = await ensureWalletShareNickname(account)
  if (nickname == null) return

  // The chooser doubles as the place to correct the name, so it loops until
  // the user picks a direction or backs out:
  while (true) {
    const name: string = nickname
    const choice = await Airship.show<
      WalletShareChoice | 'editNickname' | undefined
    >(bridge => (
      <WalletShareChooserModal
        bridge={bridge}
        nickname={name}
        onEditNickname={() => {
          bridge.resolve('editNickname')
        }}
      />
    ))
    if (choice === 'editNickname') {
      nickname = (await editWalletShareNickname(account, name)) ?? name
      continue
    }
    if (choice === 'share') await scanForWalletShare(account, name)
    else if (choice === 'receive') await receiveSharedWallets(account)
    return
  }
}

/**
 * The sharer scans the recipient's QR. Anything that parses as a share link
 * is routed the same way the side-menu scanner would route it.
 */
async function scanForWalletShare(
  account: EdgeAccount,
  nickname: string
): Promise<void> {
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
    await shareWalletsToLobby(account, link.lobbyId, link.displayName, nickname)
  } else if (link.type === 'walletShareOffer') {
    await acceptOfferedWallets(account, link.lobbyId, link.displayName)
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
  lobbyId: string,
  counterpartyName: string = '',
  ownNickname?: string
): Promise<void> {
  // A share link opened from outside the share flow still needs a name to
  // send, so ask here when the caller had no chance to:
  const nickname = ownNickname ?? (await ensureWalletShareNickname(account))
  if (nickname == null) return

  const wallets = await Airship.show<EdgeCurrencyWallet[] | undefined>(
    bridge => (
      <WalletShareSelectModal
        bridge={bridge}
        counterpartyName={counterpartyName}
      />
    )
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
      counterpartyName={counterpartyName}
      onConfirm={async () => {
        await account.approveWalletShare(lobbyId, specs, {
          displayName: nickname,
          counterpartyName
        })
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
  let nickname = await ensureWalletShareNickname(account)
  if (nickname == null) return

  // The name is baked into the QR, so renaming means a fresh lobby:
  while (true) {
    let pending: EdgePendingWalletShare
    try {
      pending = await account.requestWalletShare({ displayName: nickname })
    } catch (error: unknown) {
      showError(error)
      return
    }
    const rename = await awaitPendingShare(account, pending, true, nickname)
    if (rename == null) return

    await pending.cancelRequest().catch(() => {
      // The lobby expires on its own; nothing to do if closing it fails.
    })
    nickname = (await editWalletShareNickname(account, nickname)) ?? nickname
  }
}

/**
 * Answer a `share-wallets` lobby. The other side chose everything already,
 * so the only question is whether we want the wallets at all.
 */
export async function acceptOfferedWallets(
  account: EdgeAccount,
  lobbyId: string,
  counterpartyName: string = ''
): Promise<void> {
  const nickname = await ensureWalletShareNickname(account)
  if (nickname == null) return

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
    pending = await account.acceptWalletShare(lobbyId, {
      displayName: nickname,
      counterpartyName
    })
  } catch (error: unknown) {
    showError(error)
    return
  }
  await awaitPendingShare(account, pending, false, nickname)
}

/**
 * Wait for a receiving-side share to finish, then show what arrived.
 */
async function awaitPendingShare(
  account: EdgeAccount,
  pending: EdgePendingWalletShare,
  showQr: boolean,
  nickname: string
): Promise<'editNickname' | undefined> {
  const walletIds = await Airship.show<string[] | 'editNickname' | undefined>(
    bridge => (
      <WalletShareReceiveModal
        bridge={bridge}
        pending={pending}
        showQr={showQr}
        nickname={nickname}
        onEditNickname={() => {
          bridge.resolve('editNickname')
        }}
      />
    )
  )
  if (walletIds === 'editNickname') return 'editNickname'
  if (walletIds == null || walletIds.length === 0) return undefined

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
    <WalletShareReceivedModal
      bridge={bridge}
      entries={entries}
      counterpartyName={pending.counterpartyName ?? ''}
    />
  ))
  return undefined
}
