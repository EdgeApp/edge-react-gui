// Core/Context/api.js

export const getCurrencyPlugins = (context) =>
  context.getCurrencyPlugins()

export const createAccount = (context, ...opts) =>
  context.createAccount(...opts)

export const getLocalAccount = (context, username, callbacks) =>
  context.getLocalAccount(username, callbacks)

export const deleteLocalAccount = (context, username) =>
  context.deleteLocalAccount(username)

export const listUsernames = (context) =>
  context.listUsernames()

export const isUsernameAvailable = (context, username) =>
  context.usernameAvailable(username)

export const loginWithPassword = (context, ...opts) =>
  context.loginWithPassword(...opts)

export const loginWithPin = (context, ...opts) =>
  context.loginWithPin(...opts)

export const hasPassword = (context, username) =>
  context.accountHasPassword(username)

export const isPinReLoginEnabled = (context, username) =>
  context.pinLoginEnabled(username)

export const requestOTPReset = (context, username, otpResetToken) =>
  context.requestOTPReset(username, otpResetToken)

  // TODO Allen: Function that returns exchange rate.
