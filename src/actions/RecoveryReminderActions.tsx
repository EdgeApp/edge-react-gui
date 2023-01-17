import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { setPasswordRecoveryRemindersAsync } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { getTotalFiatAmountFromExchangeRates } from '../util/utils'

const levels = ['20', '200', '2000', '20000', '200000'] as const

/**
 * Show a modal if the user's balance is over one of the limits &
 * they don't have recovery set up.
 */
export function checkPasswordRecovery(navigation: NavigationBase): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    if (account.recoveryKey != null) return

    const totalDollars = getTotalFiatAmountFromExchangeRates(state, 'iso:USD')
    const { passwordRecoveryRemindersShown } = state.ui.settings

    // Loop towards the highest non-shown level less than our balance:
    for (const level of levels) {
      if (passwordRecoveryRemindersShown[level]) continue
      if (totalDollars < parseInt(level)) return

      // Mark this level as shown:
      dispatch({ type: 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL', data: level })
      setPasswordRecoveryRemindersAsync(account, level).catch(showError)
      showReminderModal(navigation).catch(showError)
      return
    }
  }
}
/**
 * Actually show the password reminder modal.
 */
async function showReminderModal(navigation: NavigationBase) {
  const reply = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.password_recovery_reminder_modal_title}
      message={s.strings.password_recovery_reminder_modal_message}
      buttons={{
        ok: { label: s.strings.password_recovery_reminder_modal_set_up },
        cancel: { label: s.strings.password_check_check_later }
      }}
    />
  ))
  if (reply === 'ok') navigation.push('passwordRecovery', {})
}
