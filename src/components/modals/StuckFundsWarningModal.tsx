import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import type { StuckFundsWarning } from '../../util/stuckFundsWarning'
import { Airship } from '../services/AirshipInstance'
import { ButtonsModal } from './ButtonsModal'

/**
 * Warns that a pending transaction drains the gas a wallet needs to move the
 * tokens it holds, and asks whether to go ahead. Resolves true to continue.
 */
export async function showStuckFundsWarningModal(
  warning: StuckFundsWarning,
  gasCurrencyCode: string,
  toCurrencyCode?: string
): Promise<boolean> {
  const message =
    warning === 'swap-into-token'
      ? sprintf(
          lstrings.stuck_funds_warning_swap_into_token_2s,
          gasCurrencyCode,
          toCurrencyCode ?? ''
        )
      : sprintf(lstrings.stuck_funds_warning_tokens_remain_1s, gasCurrencyCode)

  const result = await Airship.show<'continue' | 'cancel' | undefined>(
    bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.stuck_funds_warning_title}
        message={message}
        warning
        buttons={{
          continue: { label: lstrings.stuck_funds_warning_continue },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    )
  )

  return result === 'continue'
}
