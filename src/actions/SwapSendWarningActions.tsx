import type { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { Paragraph } from '../components/themed/EdgeText'
import { SWAP_SEND_WARNING } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

/** The sheet currently on screen, so overlapping calls do not stack a second one. */
let pendingWarning: Promise<boolean> | undefined

/**
 * Explain, the first time a send turns into a swap, that the send scene is no
 * longer paying the recipient directly: the wallet pays the swap provider, and
 * the provider pays the recipient. It also names the two risks of that shape:
 * a rare compliance hold, and that a held swap is the provider's to resolve.
 *
 * Agreeing records the acknowledgement once per account, like the send scam
 * warning it sits beside. The sheet can also be dismissed (close button,
 * Back, tapping behind it) without agreeing: nothing is recorded, so the
 * sheet shows again on the next swap-send, and the caller backs the send out
 * of its swap.
 *
 * Resolves true only for the call whose own sheet the user dismissed. A call
 * that arrives while a sheet is already up waits for it and resolves false,
 * so the caller's decline handling runs once.
 **/
export const showSwapSendWarningModal = async (
  disklet: Disklet,
  providerName: string
): Promise<boolean> => {
  // A missing key means the user never agreed:
  const acknowledged = await disklet.getText(SWAP_SEND_WARNING).then(
    () => true,
    () => false
  )
  if (acknowledged) return false

  if (pendingWarning != null) {
    await pendingWarning
    return false
  }

  pendingWarning = showWarningSheet(providerName)
  try {
    const agreed = await pendingWarning
    if (agreed) await disklet.setText(SWAP_SEND_WARNING, '')
    return !agreed
  } finally {
    pendingWarning = undefined
  }
}

const showWarningSheet = async (providerName: string): Promise<boolean> => {
  const routingMessage = sprintf(
    lstrings.stealth_swap_send_modal_message_2s,
    config.appName,
    providerName
  )
  const recoveryMessage = sprintf(
    lstrings.stealth_swap_send_modal_message_recovery_1s,
    config.appName
  )
  const message = [
    routingMessage,
    lstrings.stealth_swap_send_modal_message_timing,
    lstrings.stealth_swap_send_modal_message_kyc,
    recoveryMessage
  ]
    .map(line => `• ${line}`)
    .join('\n\n')

  return await Airship.show<boolean>(bridge => (
    <ConfirmContinueModal
      bridge={bridge}
      isSkippable
      title={lstrings.stealth_swap_send_modal_title}
    >
      <Paragraph>{message}</Paragraph>
    </ConfirmContinueModal>
  ))
}
