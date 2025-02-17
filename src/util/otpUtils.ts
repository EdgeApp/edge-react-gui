import { asBoolean, asDate, asObject, asOptional } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { makeEvent } from 'yavent'

const OTP_REMINDER_STORE_NAME = 'app.edge.login'
const OTP_REMINDER_KEY_NAME_LAST_OTP_CHECKED = 'lastOtpCheck'
const OTP_REMINDER_KEY_NAME_DONT_ASK = 'OtpDontAsk'

export const OTP_REMINDER_MILLISECONDS = 7 * 24 * 60 * 60 * 1000

// Combined settings interface
export interface OtpSettings {
  lastChecked: Date | null
  dontAsk: boolean
}

// Cleaner for the settings
export const asOtpSettings = asObject({
  lastChecked: asOptional(asDate, null),
  dontAsk: asOptional(asBoolean, false)
})

// Local state management
let localOtpSettings: OtpSettings = {
  lastChecked: null,
  dontAsk: false
}

// Event emitter for settings changes
const [watchOtpSettings, emitOtpSettings] = makeEvent<OtpSettings>()

export const getOtpSettings = (): OtpSettings => localOtpSettings

// React hook for accessing OTP settings
export function useOtpSettings(): OtpSettings {
  const [, setOtpSettings] = React.useState(getOtpSettings())
  React.useEffect(() => watchOtpSettings(setOtpSettings), [])
  return localOtpSettings
}

// Read settings from disk
export async function readOtpSettings(account: EdgeAccount): Promise<OtpSettings> {
  const [lastCheckedStr, dontAskStr] = await Promise.all([
    account.dataStore.getItem(OTP_REMINDER_STORE_NAME, OTP_REMINDER_KEY_NAME_LAST_OTP_CHECKED).catch(() => null),
    account.dataStore.getItem(OTP_REMINDER_STORE_NAME, OTP_REMINDER_KEY_NAME_DONT_ASK).catch(() => null)
  ])

  const settings: OtpSettings = {
    lastChecked: lastCheckedStr != null ? new Date(parseInt(lastCheckedStr)) : null,
    dontAsk: dontAskStr === 'true'
  }

  localOtpSettings = settings
  return settings
}

// Write settings to disk
export async function writeOtpSettings(account: EdgeAccount, settings: Partial<OtpSettings>): Promise<void> {
  const newSettings = { ...localOtpSettings, ...settings }

  const promises: Array<Promise<void>> = []

  if (settings.lastChecked !== undefined) {
    promises.push(account.dataStore.setItem(OTP_REMINDER_STORE_NAME, OTP_REMINDER_KEY_NAME_LAST_OTP_CHECKED, settings.lastChecked?.toString() ?? '0'))
  }

  if (settings.dontAsk !== undefined) {
    promises.push(account.dataStore.setItem(OTP_REMINDER_STORE_NAME, OTP_REMINDER_KEY_NAME_DONT_ASK, settings.dontAsk?.toString() ?? 'false'))
  }

  await Promise.all(promises)
  localOtpSettings = newSettings
  emitOtpSettings(newSettings)
}
