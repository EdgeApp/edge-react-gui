// @flow

import { type EdgeAccount } from 'edge-core-js/types'

import { lockStartDates } from '../types/AppTweaks.js'
import { type CreationReason, packCreationReason, unpackCreationReason } from '../types/CreationReason.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

const CREATION_REASON_FILE = 'CreationReason.json'

/**
 * Call this at login time to load the creation reason from account storage.
 */
export const loadCreationReason = (account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  // First try the disk:
  try {
    const text = await account.disklet.getText(CREATION_REASON_FILE)
    const creationReason = unpackCreationReason(JSON.parse(text))
    dispatch({ type: 'CREATION_REASON_LOADED', data: creationReason })
    return
  } catch (error) {}

  // Do not affiliate already-created accounts:
  if (!account.newAccount) return

  // Copy the app install reason into the account:
  const state = getState()
  const { installerId, appTweaks } = state.installReason
  const creationDate = new Date()
  const creationReason: CreationReason = {
    creationDate,
    installerId,
    appTweaks: lockStartDates(appTweaks, creationDate)
  }

  dispatch({ type: 'CREATION_REASON_LOADED', data: creationReason })
  await account.disklet.setText(CREATION_REASON_FILE, JSON.stringify(packCreationReason(creationReason)))
}
