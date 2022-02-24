// @flow

import { OtpError } from 'edge-core-js'
import * as React from 'react'

import { TextInputModal } from '../components/modals/TextInputModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { OTP_REPAIR_SCENE } from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'

export const handleOtpError = (otpError: OtpError) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account, otpErrorShown } = state.core

  if (account.loggedIn && !otpErrorShown) {
    dispatch({ type: 'OTP_ERROR_SHOWN' })
    Actions.push(OTP_REPAIR_SCENE, {
      otpError
    })
  }
}

type ValidatePasswordOptions = {
  message?: string,
  submitLabel?: string,
  title?: string,
  warning?: string
}

export const validatePassword =
  (opts: ValidatePasswordOptions = {}) =>
  async (dispatch: Dispatch, getState: GetState): Promise<boolean> => {
    const { message, submitLabel, title = s.strings.confirm_password_text, warning } = opts
    const state = getState()
    const { account } = state.core

    const password = await Airship.show(bridge => (
      <TextInputModal
        autoCorrect={false}
        bridge={bridge}
        inputLabel={s.strings.enter_your_password}
        message={message}
        returnKeyType="go"
        secureTextEntry
        submitLabel={submitLabel}
        title={title}
        warning={warning}
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

export const deleteLocalAccount = (username: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  return state.core.context.deleteLocalAccount(username).catch(showError)
}
