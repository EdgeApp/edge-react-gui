// Core/Context/api.js

export const getCurrencyPlugins = (context) => {
  return context.getCurrencyPlugins()
}

export const createAccount = (context, ...opts) => {
  return context.createAccount(...opts)
}

export const getLocalAccount = (context, username, callbacks) => {
  return context.getLocalAccount(username, callbacks)
}

export const deleteLocalAccount = (context, username) => {
  return context.deleteLocalAccount(username)
}

export const listUsernames = (context) => {
  return context.listUsernames()
}

export const isUsernameAvailable = (context, username) => {
  return context.usernameAvailable(username)
}

export const loginWithPassword = (context, ...opts) => {
  return context.loginWithPassword(...opts)
}

export const loginWithPin = (context, ...opts) => {
  return context.loginWithPin(...opts)
}

export const hasPassword = (context, username) => {
  return context.accountHasPassword(username)
}

export const isPinReLoginEnabled = (context, username) => {
  return context.pinLoginEnabled(username)
}

export const requestOTPReset = (context, username, otpResetToken) => {
  return context.requestOTPReset(username, otpResetToken)
}

  // TODO Allen: Function that returns exchange rate.
