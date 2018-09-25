// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'
import { MILLISECONDS_PER_DAY, daysBetween } from '../../modules/utils.js'

export const INITIAL_NON_PASSWORD_DAYS_LIMIT = 2
export const INITIAL_NON_PASSWORD_LOGINS_LIMIT = 2

export const MAX_NON_PASSWORD_DAYS_LIMIT = 64 // max number of consecutive non password days
export const MAX_NON_PASSWORD_LOGINS_LIMIT = 128 // max number of consecutive non password logins

export const NON_PASSWORD_DAYS_GROWTH_RATE = 4
export const NON_PASSWORD_LOGINS_GROWTH_RATE = 4

export const NON_PASSWORD_DAYS_POSTPONEMENT = 2
export const NON_PASSWORD_LOGINS_POSTPONEMENT = 2

export const INITIAL_PASSWORD_USES = 0

type NewAccountAction = {
  type: 'NEW_ACCOUNT_LOGIN',
  data: {
    lastLoginDate: number
  }
}
type PasswordUsedAction = {
  type: 'PASSWORD_USED',
  data: {
    lastPasswordUseDate: number
  }
}
type PasswordLoginAction = {
  type: 'PASSWORD_LOGIN',
  data: {
    lastPasswordUseDate: number,
    passwordUseCount: number,
    nonPasswordDaysLimit: number,
    nonPasswordLoginsLimit: number,
    lastLoginDate: number
  }
}
type PasswordReminderPostponedAction = {
  type: 'PASSWORD_REMINDER_POSTPONED',
  data: {}
}
type NonPasswordLoginAction = {
  type: 'NON_PASSWORD_LOGIN',
  data: {
    lastPasswordUseDate: number,
    nonPasswordDaysLimit: number,
    nonPasswordLoginsLimit: number,
    nonPasswordLoginsCount: number,
    lastLoginDate: number
  }
}
type ChangePasswordAction = {
  type: 'REQUEST_CHANGE_PASSWORD',
  data: {}
}
type DefaultAction = {
  type: 'default',
  data: {}
}

export type PasswordReminderReducerAction =
  | NewAccountAction
  | PasswordUsedAction
  | PasswordLoginAction
  | PasswordReminderPostponedAction
  | NonPasswordLoginAction
  | ChangePasswordAction
  | DefaultAction

export type PasswordReminderState = {
  lastLoginDate: number,
  lastPasswordUseDate: number,
  needsPasswordCheck: boolean,
  nonPasswordDaysLimit: number,
  nonPasswordLoginsCount: number,
  nonPasswordLoginsLimit: number,
  passwordUseCount: number
}

export const initialState = {
  lastLoginDate: -Infinity,
  lastPasswordUseDate: -Infinity,
  needsPasswordCheck: false,
  nonPasswordDaysLimit: INITIAL_NON_PASSWORD_DAYS_LIMIT,
  nonPasswordLoginsCount: 0,
  nonPasswordLoginsLimit: INITIAL_NON_PASSWORD_LOGINS_LIMIT,
  passwordUseCount: 0
}

export const untranslatedReducer = (state: PasswordReminderState = initialState, action: PasswordReminderReducerAction) => {
  switch (action.type) {
    case 'NEW_ACCOUNT_LOGIN': {
      const lastPasswordUseDate = action.data.lastLoginDate

      return {
        ...state,
        ...action.data,
        lastPasswordUseDate
      }
    }

    case 'PASSWORD_LOGIN': {
      const passwordUseCount = action.data.passwordUseCount + 1
      const lastPasswordUseDate = action.data.lastLoginDate
      const needsPasswordCheck = false
      const nonPasswordLoginsCount = 0

      const nonPasswordDaysLimit = Math.min(Math.pow(NON_PASSWORD_DAYS_GROWTH_RATE, passwordUseCount), MAX_NON_PASSWORD_DAYS_LIMIT)
      const nonPasswordLoginsLimit = Math.min(Math.pow(NON_PASSWORD_LOGINS_GROWTH_RATE, passwordUseCount), MAX_NON_PASSWORD_LOGINS_LIMIT)

      return {
        ...state,
        ...action.data,
        lastPasswordUseDate,
        needsPasswordCheck,
        nonPasswordDaysLimit,
        nonPasswordLoginsCount,
        nonPasswordLoginsLimit,
        passwordUseCount
      }
    }

    case 'NON_PASSWORD_LOGIN': {
      const nonPasswordLoginsCount = action.data.nonPasswordLoginsCount + 1
      const needsPasswordCheck =
        nonPasswordLoginsCount >= action.data.nonPasswordLoginsLimit ||
        daysBetween(action.data.lastPasswordUseDate, action.data.lastLoginDate) >= action.data.nonPasswordDaysLimit

      return {
        ...state,
        ...action.data,
        nonPasswordLoginsCount,
        needsPasswordCheck
      }
    }

    case 'PASSWORD_USED': {
      const passwordUseCount = state.passwordUseCount + 1
      const lastPasswordUseDate = action.data.lastPasswordUseDate
      const needsPasswordCheck = false
      const nonPasswordLoginsCount = 0
      const nonPasswordDaysLimit = Math.min(Math.pow(NON_PASSWORD_DAYS_GROWTH_RATE, passwordUseCount), MAX_NON_PASSWORD_DAYS_LIMIT)
      const nonPasswordLoginsLimit = Math.min(Math.pow(NON_PASSWORD_LOGINS_GROWTH_RATE, passwordUseCount), MAX_NON_PASSWORD_LOGINS_LIMIT)

      return {
        ...state,
        ...action.data,
        passwordUseCount,
        lastPasswordUseDate,
        needsPasswordCheck,
        nonPasswordDaysLimit,
        nonPasswordLoginsCount,
        nonPasswordLoginsLimit
      }
    }

    case 'PASSWORD_REMINDER_POSTPONED': {
      const nonPasswordDaysLimit = state.lastLoginDate / MILLISECONDS_PER_DAY - state.lastPasswordUseDate / MILLISECONDS_PER_DAY + 2
      const nonPasswordLoginsLimit = state.nonPasswordLoginsCount + 2
      const needsPasswordCheck = false

      return {
        ...state,
        ...action.data,
        nonPasswordDaysLimit,
        nonPasswordLoginsLimit,
        needsPasswordCheck
      }
    }

    case 'REQUEST_CHANGE_PASSWORD': {
      return {
        ...initialState
      }
    }

    default:
      return state
  }
}

export const translate = (reducer: typeof untranslatedReducer): Reducer<PasswordReminderState, Action> => (state, action: Action) => {
  let translatedAction = {
    type: 'default',
    data: {}
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === 'ACCOUNT_INIT_COMPLETE') && action.data.account.newAccount) {
    const now = Date.now()
    translatedAction = {
      type: 'NEW_ACCOUNT_LOGIN',
      data: {
        lastLoginDate: now,
        lastPasswordUseDate: now
      }
    }
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === 'ACCOUNT_INIT_COMPLETE') && action.data.account.passwordLogin) {
    const now = Date.now()
    translatedAction = {
      type: 'PASSWORD_LOGIN',
      data: {
        // $FlowFixMe
        ...action.data.passwordReminder,
        lastLoginDate: now,
        lastPasswordUseDate: now
      }
    }
  }

  // $FlowFixMe
  if ((action.type === 'LOGIN' || action.type === 'ACCOUNT_INIT_COMPLETE') && !(action.data.account.passwordLogin || action.data.account.newAccount)) {
    translatedAction = {
      type: 'NON_PASSWORD_LOGIN',
      data: {
        // $FlowFixMe
        ...action.data.passwordReminder,
        lastLoginDate: Date.now()
      }
    }
  }

  if (action.type === 'UI/SETTINGS/SET_SETTINGS_LOCK' && action.data === false) {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        lastPasswordUseDate: Date.now()
      }
    }
  }
  if (action.type === 'UNLOCK_WALLET_SEED') {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        lastPasswordUseDate: Date.now()
      }
    }
  }
  if (action.type === 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS') {
    translatedAction = {
      type: 'PASSWORD_USED',
      data: {
        lastPasswordUseDate: Date.now()
      }
    }
  }

  if (action.type === 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED') {
    translatedAction = {
      type: 'PASSWORD_REMINDER_POSTPONED',
      data: {}
    }
  }

  if (action.type === 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD') {
    translatedAction = {
      type: 'REQUEST_CHANGE_PASSWORD',
      data: {}
    }
  }

  return reducer(state, translatedAction)
}

export const passwordReminder: Reducer<PasswordReminderState, Action> = translate(untranslatedReducer)
