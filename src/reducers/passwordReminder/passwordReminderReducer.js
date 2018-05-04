// @flow

import type { Action } from '../../modules/ReduxTypes.js'
import { daysBetween } from '../../modules/utils.js'
import { ACCOUNT_INIT_COMPLETE } from '../../constants/indexConstants.js'
import { SET_SETTINGS_LOCK } from '../../modules/UI/Settings/action.js'
import { UNLOCK as UNLOCK_WALLET_SEED } from '../../modules/UI/scenes/WalletList/components/GetSeedModal/GetSeedModalConnector.js'
import { CHECK_PASSWORD_SUCCESS, REQUEST_CHANGE_PASSWORD } from '../../modules/UI/components/PasswordReminderModal/indexPasswordReminderModal.js'
import { PASSWORD_REMINDER_POSTPONED } from './indexPasswordReminder.js'

export const INITIAL_NON_PASSWORD_DAYS_LIMIT = 8
export const INITIAL_NON_PASSWORD_LOGINS_LIMIT = 8
export const INITIAL_NON_PASSWORD_DAYS_REMAINING = 8
export const INITIAL_NON_PASSWORD_LOGINS_REMAINING = 8

export const MAX_NON_PASSWORD_DAYS_LIMIT = 32 // max number of consecutive non password days
export const MAX_NON_PASSWORD_LOGINS_LIMIT = 128 // max number of consecutive non password logins

export const NON_PASSWORD_DAYS_GROWTH_RATE = 2
export const NON_PASSWORD_LOGINS_GROWTH_RATE = 2

export const NON_PASSWORD_DAYS_POSTPONEMENT = 4
export const NON_PASSWORD_LOGINS_POSTPONEMENT = 4

export type PasswordReminderReducerAction =
  | {
      type: 'NEW_ACCOUNT_LOGIN',
      data: {
        currentDate: number
      }
    }
  | {
      type: 'PASSWORD_USED',
      data: {
        currentDate: number
      }
    }
  | {
      type: 'PASSWORD_REMINDER_POSTPONED',
      data: {
        currentDate: number
      }
    }
  | {
      type: 'PASSWORD_LOGIN',
      data: {
        needsPasswordCheck: boolean,
        lastPasswordUse: number,
        nonPasswordDaysRemaining: number,
        nonPasswordLoginsRemaining: number,
        nonPasswordDaysLimit: number,
        nonPasswordLoginsLimit: number,
        currentDate: number
      }
    }
  | {
      type: 'NON_PASSWORD_LOGIN',
      data: {
        needsPasswordCheck: boolean,
        lastPasswordUse: number,
        nonPasswordDaysRemaining: number,
        nonPasswordLoginsRemaining: number,
        nonPasswordDaysLimit: number,
        nonPasswordLoginsLimit: number,
        currentDate: number
      }
    }
  | {
      type: 'REQUEST_CHANGE_PASSWORD',
      data: {
        currentDate: number
      }
    }
  | {
      type: 'default',
      data: {}
    }

export type PasswordReminderState = {
  needsPasswordCheck: boolean,
  lastPasswordUse: number,
  nonPasswordDaysRemaining: number,
  nonPasswordLoginsRemaining: number,
  nonPasswordDaysLimit: number,
  nonPasswordLoginsLimit: number
}

export const initialState = {
  needsPasswordCheck: false,
  lastPasswordUse: 0,
  nonPasswordDaysRemaining: INITIAL_NON_PASSWORD_DAYS_REMAINING,
  nonPasswordLoginsRemaining: INITIAL_NON_PASSWORD_LOGINS_REMAINING,
  nonPasswordDaysLimit: INITIAL_NON_PASSWORD_DAYS_LIMIT,
  nonPasswordLoginsLimit: INITIAL_NON_PASSWORD_LOGINS_LIMIT
}

export const untranslatedReducer = (state: PasswordReminderState = initialState, action: PasswordReminderReducerAction) => {
  switch (action.type) {
    case 'NEW_ACCOUNT_LOGIN': {
      const lastPasswordUse = action.data.currentDate

      return {
        ...state,
        lastPasswordUse
      }
    }

    case 'PASSWORD_LOGIN': {
      const lastPasswordUse = action.data.currentDate
      const nonPasswordDaysLimit = Math.min(action.data.nonPasswordDaysLimit * NON_PASSWORD_DAYS_GROWTH_RATE, MAX_NON_PASSWORD_DAYS_LIMIT)
      const nonPasswordLoginsLimit = Math.min(action.data.nonPasswordLoginsLimit * NON_PASSWORD_LOGINS_GROWTH_RATE, MAX_NON_PASSWORD_LOGINS_LIMIT)
      const nonPasswordDaysRemaining = nonPasswordDaysLimit
      const nonPasswordLoginsRemaining = nonPasswordLoginsLimit
      const needsPasswordCheck = nonPasswordLoginsRemaining <= 0 || nonPasswordDaysRemaining <= 0

      return {
        ...state,
        lastPasswordUse,
        nonPasswordDaysRemaining,
        nonPasswordLoginsRemaining,
        nonPasswordDaysLimit,
        nonPasswordLoginsLimit,
        needsPasswordCheck
      }
    }

    case 'NON_PASSWORD_LOGIN': {
      const lastPasswordUse = action.data.lastPasswordUse
      const nonPasswordDaysLimit = action.data.nonPasswordDaysLimit
      const nonPasswordLoginsLimit = action.data.nonPasswordLoginsLimit
      const nonPasswordDaysRemaining = action.data.nonPasswordDaysLimit - daysBetween(action.data.lastPasswordUse, action.data.currentDate)
      const nonPasswordLoginsRemaining = action.data.nonPasswordLoginsRemaining - 1
      const needsPasswordCheck = nonPasswordLoginsRemaining <= 0 || nonPasswordDaysRemaining <= 0

      return {
        ...state,
        lastPasswordUse,
        nonPasswordLoginsRemaining,
        nonPasswordDaysRemaining,
        nonPasswordLoginsLimit,
        nonPasswordDaysLimit,
        needsPasswordCheck
      }
    }

    case 'PASSWORD_USED': {
      const lastPasswordUse = action.data.currentDate
      const nonPasswordDaysLimit = Math.min(state.nonPasswordDaysLimit * NON_PASSWORD_DAYS_GROWTH_RATE, MAX_NON_PASSWORD_DAYS_LIMIT)
      const nonPasswordLoginsLimit = Math.min(state.nonPasswordLoginsLimit * NON_PASSWORD_LOGINS_GROWTH_RATE, MAX_NON_PASSWORD_LOGINS_LIMIT)
      const nonPasswordDaysRemaining = nonPasswordDaysLimit
      const nonPasswordLoginsRemaining = nonPasswordLoginsLimit
      const needsPasswordCheck = nonPasswordLoginsRemaining <= 0 || nonPasswordDaysRemaining <= 0

      return {
        ...state,
        lastPasswordUse,
        nonPasswordDaysRemaining,
        nonPasswordLoginsRemaining,
        nonPasswordDaysLimit,
        nonPasswordLoginsLimit,
        needsPasswordCheck
      }
    }

    case 'PASSWORD_REMINDER_POSTPONED': {
      const nonPasswordDaysRemaining = NON_PASSWORD_DAYS_POSTPONEMENT
      const nonPasswordLoginsRemaining = NON_PASSWORD_LOGINS_POSTPONEMENT
      const needsPasswordCheck = nonPasswordLoginsRemaining <= 0 || nonPasswordDaysRemaining <= 0

      return {
        ...state,
        needsPasswordCheck,
        nonPasswordDaysRemaining,
        nonPasswordLoginsRemaining
      }
    }

    case 'REQUEST_CHANGE_PASSWORD': {
      const lastPasswordUse = action.data.currentDate // fake to prevent recalulation using older date

      return {
        ...initialState,
        lastPasswordUse
      }
    }

    default:
      return state
  }
}

export const translate = (reducer: typeof untranslatedReducer) => (state: PasswordReminderState, action: Action): PasswordReminderState => {
  let translatedAction = {
    type: 'default',
    data: {}
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === ACCOUNT_INIT_COMPLETE) && action.data.account.newAccount) {
    translatedAction = {
      type: 'NEW_ACCOUNT_LOGIN',
      data: {
        currentDate: Date.now()
      }
    }
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === ACCOUNT_INIT_COMPLETE) && action.data.account.passwordLogin) {
    translatedAction = {
      type: 'PASSWORD_LOGIN',
      data: {
        // $FlowFixMe
        ...action.data.passwordReminder,
        currentDate: Date.now()
      }
    }
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === ACCOUNT_INIT_COMPLETE) && !(action.data.account.passwordLogin || action.data.account.newAccount)) {
    translatedAction = {
      type: 'NON_PASSWORD_LOGIN',
      data: {
        // $FlowFixMe
        ...action.data.passwordReminder,
        currentDate: Date.now()
      }
    }
  }

  if (action.type === SET_SETTINGS_LOCK && action.data === false) {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        currentDate: Date.now()
      }
    }
  }
  if (action.type === UNLOCK_WALLET_SEED) {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        currentDate: Date.now()
      }
    }
  }
  if (action.type === CHECK_PASSWORD_SUCCESS) {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        currentDate: Date.now()
      }
    }
  }

  if (action.type === PASSWORD_REMINDER_POSTPONED) {
    translatedAction = {
      type: 'PASSWORD_REMINDER_POSTPONED',
      data: {
        currentDate: Date.now()
      }
    }
  }

  if (action.type === REQUEST_CHANGE_PASSWORD) {
    translatedAction = {
      type: 'REQUEST_CHANGE_PASSWORD',
      data: {
        currentDate: Date.now()
      }
    }
  }

  return reducer(state, translatedAction)
}

export const passwordReminderReducer = translate(untranslatedReducer)
