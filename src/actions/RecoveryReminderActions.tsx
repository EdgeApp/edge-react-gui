import { gte } from 'biggystring'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { writePasswordRecoveryReminders } from '../actions/SettingsActions'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { getExchangeRate } from '../selectors/WalletSelectors'
import type { RootState, ThunkAction } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import { isMaestro } from '../util/maestro'
import { getTotalFiatAmountFromExchangeRates, zeroString } from '../util/utils'

const levels = ['20', '200', '2000', '20000', '200000'] as const

/**
 * How long to keep waiting for exchange rates before pricing the balance with
 * whatever rates have arrived. Rates land within a refresh cycle or two of
 * login; anything still missing after this is an asset the rates server does
 * not price, which will never arrive.
 */
const RATES_GRACE_MS = 5 * 60 * 1000

/**
 * When each account started waiting for its rates. The window belongs to the
 * login session, not the process: a user can sit on the login screen past the
 * grace window (a restore, a 2FA prompt), or log into a second account later
 * in the same session. Keying on the account object gives a re-login a fresh
 * window and lets the entry clean itself up.
 */
const graceStartMs = new WeakMap<EdgeAccount, number>()

/**
 * Show a modal if the user's balance is over one of the limits &
 * they don't have recovery set up.
 *
 * This runs on each exchange-rate refresh as well as on incoming
 * transactions, since funds can arrive while the app is closed and the rates
 * needed to price them can land after the transaction does.
 */
export function checkPasswordRecovery(
  navigation: NavigationBase
): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    // Light accounts have no password to recover:
    if (account.username == null) return
    if (account.recoveryKey != null) return
    if (isMaestro()) return

    const { passwordRecoveryRemindersShown } = state.ui.settings

    // This runs on every rates refresh for the life of the session, so stop
    // before the wallet walks below once there is no reminder left to show:
    if (levels.every(level => passwordRecoveryRemindersShown[level])) return

    // An incomplete rate set undercounts the balance, which would credit the
    // wrong milestone, so give the rates a chance to land. The wait is
    // bounded: a wallet the rates server never prices (a testnet coin, an
    // unlisted chain) has no rate coming, and must not suppress the reminder
    // for the rest of the session:
    const now = Date.now()
    const graceStart = graceStartMs.get(account) ?? now
    graceStartMs.set(account, graceStart)
    const ratesSettling = now - graceStart < RATES_GRACE_MS
    if (ratesSettling && !hasRatesForFundedWallets(state)) return

    const totalDollars = getTotalFiatAmountFromExchangeRates(state, 'iso:USD')

    // Every level the balance has passed, whether or not it was passed just
    // now. A balance that jumps straight to $500 has crossed both $20 and
    // $200, and is owed one reminder, not two:
    const crossedLevels = levels.filter(level => gte(totalDollars, level))
    const newLevels = crossedLevels.filter(
      level => !passwordRecoveryRemindersShown[level]
    )
    if (newLevels.length === 0) return

    // Mark them shown before showing the modal, so the next check doesn't
    // stack a second one on top:
    for (const level of newLevels) {
      dispatch({
        type: 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL',
        data: level
      })
    }
    writePasswordRecoveryReminders(account, newLevels).catch(
      (error: unknown) => {
        showError(error)
      }
    )
    showReminderModal(() => {
      navigation.push('passwordRecovery')
    }).catch((error: unknown) => {
      showError(error)
    })
  }
}

/**
 * True when every funded wallet has a USD exchange rate for its native
 * currency.
 *
 * `getExchangeRate` returns 0 for a rate it hasn't loaded, so a rate set that
 * is still loading is indistinguishable from a small balance by total alone.
 * Only the native currency is checked: a token the rates server doesn't know,
 * or legitimately prices at 0, never gets a rate, so waiting on one would
 * suppress the reminder for the life of the account.
 */
function hasRatesForFundedWallets(state: RootState): boolean {
  const { exchangeRates } = state
  const { currencyWallets } = state.core.account
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const isFunded = [...wallet.balanceMap.values()].some(
      nativeBalance => !zeroString(nativeBalance)
    )
    if (!isFunded) continue

    const rate = getExchangeRate(
      exchangeRates,
      wallet.currencyInfo.pluginId,
      null,
      'iso:USD'
    )
    if (rate === 0) return false
  }
  return true
}
/**
 * Actually show the password reminder modal, calling `onSetUp` if the user
 * chooses to set recovery up now.
 */
async function showReminderModal(onSetUp: () => void): Promise<void> {
  const reply = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.password_recovery_reminder_modal_title}
      message={lstrings.password_recovery_reminder_modal_message}
      buttons={{
        ok: { label: lstrings.password_recovery_reminder_modal_set_up },
        cancel: { label: lstrings.password_check_check_later }
      }}
    />
  ))
  if (reply === 'ok') onSetUp()
}
