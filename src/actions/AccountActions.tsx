import { OtpError } from 'edge-core-js'
import * as React from 'react'

import { TextInputModal } from '../components/modals/TextInputModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'

export function handleOtpError(navigation: NavigationBase, otpError: OtpError): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account, otpErrorShown } = state.core

    if (account.loggedIn && !otpErrorShown) {
      dispatch({ type: 'OTP_ERROR_SHOWN' })
      navigation.push('otpRepair', {
        otpError
      })
    }
  }
}

interface ValidatePasswordOptions {
  message?: string
  submitLabel?: string
  title?: string
  warningMessage?: string
}

export function validatePassword(opts: ValidatePasswordOptions = {}): ThunkAction<Promise<boolean>> {
  return async (dispatch, getState) => {
    const { message, submitLabel, title = s.strings.confirm_password_text, warningMessage } = opts
    const state = getState()
    const { account } = state.core
    const password = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoFocus={warningMessage == null}
        autoCorrect={false}
        bridge={bridge}
        inputLabel={s.strings.enter_your_password}
        message={message}
        returnKeyType="go"
        secureTextEntry
        submitLabel={submitLabel}
        title={title}
        warningMessage={warningMessage}
        onSubmit={async password => {
          const isOk = await account.checkPassword(password)
          if (!isOk) return s.strings.password_reminder_invalid
          dispatch({ type: 'PASSWORD_USED' })
          return true
        }}
      />
    ))

    return password != null
  }
}

export function deleteLocalAccount(username: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    return state.core.context.deleteLocalAccount(username).catch(showError)
  }
}
