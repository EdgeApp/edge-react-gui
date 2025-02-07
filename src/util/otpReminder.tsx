import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { OTP_REMINDER_MILLISECONDS, readOtpSettings, writeOtpSettings } from './otpUtils'

/**
 * Return an otp reminder modal, with or without a "don't ask again" button,
 * depending on if they've seen this before.
 */
export async function showOtpReminderModal(account: EdgeAccount): Promise<void> {
  const { created } = account
  const { lastChecked } = await readOtpSettings(account)
  Keyboard.dismiss()

  // Return a modal if we have never shown it before, and the account is old
  // enough:
  if (lastChecked == null && (created == null || Date.now() > created.valueOf() + OTP_REMINDER_MILLISECONDS)) {
    const result = await Airship.show<'yes' | 'no' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.otp_reset_modal_header}
        message={lstrings.otp_reset_modal_message}
        buttons={{
          yes: { label: lstrings.otp_enable },
          no: { label: lstrings.skip, type: 'secondary' }
        }}
      />
    ))
    if (result === 'yes') {
      await enableOtp(account)
    } else {
      await writeOtpSettings(account, { lastChecked: new Date(Date.now()) })
    }
  } else {
    // Return a modal with the "Don't ask again" button if we showed the first
    // modal already:
    const result = await Airship.show<'enable' | 'cancel' | 'dontAsk' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.otp_reset_modal_header}
        message={lstrings.otp_reset_modal_message}
        buttons={{
          enable: { label: lstrings.otp_enable, type: 'primary' },
          cancel: { label: lstrings.skip, type: 'secondary' },
          dontAsk: {
            label: lstrings.otp_reset_modal_dont_ask,
            type: 'secondary'
          }
        }}
      />
    ))
    if (result === 'enable') {
      await enableOtp(account)
    } else if (result === 'dontAsk') {
      await writeOtpSettings(account, { dontAsk: true })
    } else {
      await writeOtpSettings(account, { lastChecked: new Date(Date.now()) })
    }
  }
}

/**
 * Enable OTP and show a success modal
 */
const enableOtp = async (account: EdgeAccount) => {
  await account.enableOtp()
  return await Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.otp_authentication_header}
      message={sprintf(lstrings.otp_authentication_message, account.otpKey)}
      buttons={{ ok: { label: lstrings.string_ok_cap } }}
    />
  ))
}
