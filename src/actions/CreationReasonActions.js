// @flow

import { type EdgeAccount } from 'edge-core-js/types'

import { type AppMessage, lockStartDates } from '../types/AppTweaks.js'
import { type CreationReason, packCreationReason, unpackCreationReason } from '../types/CreationReason.js'
import { type Dispatch, type GetState, type State } from '../types/reduxTypes.js'

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
  saveCreationReason(getState())
}

/**
 * Removes the given creation reason message.
 */
export const removeCreationMessage = (message: AppMessage) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'CREATION_REASON_REMOVE_MESSAGE', data: message })
  saveCreationReason(getState())
}

/**
 * Removes the preferred swap plugin from the affilation app tweaks.
 */
export const removeCreationSwapPlugin = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'CREATION_REASON_REMOVE_SWAP' })
  saveCreationReason(getState())
}

/**
 * Writes the creation reason from redux to the disk.
 */
async function saveCreationReason (state: State): Promise<void> {
  const { account } = state.core
  const { creationReason } = state.account
  if (creationReason == null) return

  await account.disklet.setText(CREATION_REASON_FILE, JSON.stringify(packCreationReason(creationReason)))
}
