import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { TextInputModal } from '../components/modals/TextInputModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { getLocalAccountSettings, writeNickname } from './LocalSettingsActions'

/**
 * The name this device shows the other party when sharing wallets.
 *
 * Device-local, like the spam filter: another device signed into the same
 * account chooses its own. Empty until the user picks one.
 */
export async function getWalletShareNickname(
  account: EdgeAccount
): Promise<string> {
  const settings = await getLocalAccountSettings(account)
  return settings.nickname
}

/**
 * Asks for a nickname and saves it. Resolves to the saved name, or undefined
 * if the user backed out.
 *
 * Blank input is not saved, so dismissing the keyboard on an empty field
 * leaves any previous name alone rather than clearing it.
 */
export async function editWalletShareNickname(
  account: EdgeAccount,
  initialValue: string
): Promise<string | undefined> {
  const entered = await Airship.show<string | undefined>(bridge => (
    <TextInputModal
      bridge={bridge}
      title={lstrings.wallet_share_nickname_title}
      inputLabel={lstrings.wallet_share_nickname_hint}
      initialValue={initialValue}
      autoCorrect={false}
      autoCapitalize="words"
      autoFocus
      returnKeyType="done"
      maxLength={64}
    />
  ))
  if (entered == null) return undefined

  const nickname = entered.trim()
  if (nickname === '') return undefined
  await writeNickname(account, nickname)
  return nickname
}

/**
 * The nickname, asking for one first if this device has none.
 * Undefined means the user declined, which abandons whatever needed it.
 */
export async function ensureWalletShareNickname(
  account: EdgeAccount
): Promise<string | undefined> {
  const nickname = await getWalletShareNickname(account)
  if (nickname !== '') return nickname
  return await editWalletShareNickname(account, '')
}
