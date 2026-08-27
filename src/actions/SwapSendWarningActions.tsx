import type { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { Paragraph, WarningText } from '../components/themed/EdgeText'
import { SWAP_SEND_WARNING } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { runOnce } from '../util/runOnce'

/**
 * Explain, the first time a send turns into a swap, that the send scene is no
 * longer paying the recipient directly: the wallet pays the swap provider, and
 * the provider pays the recipient. Shown once per account, like the send scam
 * warning it sits beside.
 **/
export const showSwapSendWarningModal = async (
  disklet: Disklet,
  providerName: string
): Promise<void> => {
  try {
    await disklet.getText(SWAP_SEND_WARNING)
  } catch (error: unknown) {
    await runOnce('swapSendWarning', async () => {
      const routingMessage = sprintf(
        lstrings.stealth_swap_send_modal_message_2s,
        config.appName,
        providerName
      )
      await Airship.show<boolean>(bridge => {
        const warningMessage = `• ${routingMessage}\n\n• ${lstrings.stealth_swap_send_modal_message_timing}`

        return (
          <ConfirmContinueModal
            bridge={bridge}
            title={lstrings.stealth_swap_send_modal_title}
            warning
          >
            <Paragraph>
              <WarningText>{warningMessage}</WarningText>
            </Paragraph>
          </ConfirmContinueModal>
        )
      })
      await disklet.setText(SWAP_SEND_WARNING, '')
    })
  }
}
