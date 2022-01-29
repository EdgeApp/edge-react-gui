// @flow
/* globals test expect */

import { mergeSettings } from '../actions/LoginActions.js'
import { asSyncedAccountSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES, SYNCED_ACCOUNT_DEFAULTS } from '../modules/Core/Account/settings.js'

test('synced settings missing properties are replaced', () => {
  const loadedSyncedSettings = {}
  const mergedSettings = asSyncedAccountSettings(loadedSyncedSettings)
  expect(mergedSettings).toEqual(SYNCED_ACCOUNT_DEFAULTS)
})

test('synced settings missing default causes console.error', () => {
  const mergedSettings = mergeSettings(SYNCED_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_DEFAULTS, {})
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(SYNCED_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(true)
})

test('local settings missing properties are replaced', () => {
  const loadedLocalSettings = {}
  const mergedSettings = mergeSettings(loadedLocalSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES)
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(LOCAL_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(false)
})

test('local settings missing default causes console.error', () => {
  const mergedSettings = mergeSettings(LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_DEFAULTS, {})
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(LOCAL_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(true)
})
