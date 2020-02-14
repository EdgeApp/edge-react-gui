// @flow

import { type AppTweaks } from '../types/AppTweaks.js'
import { type State } from '../types/reduxTypes.js'

export function getCreationTweaks (state: State): AppTweaks {
  if (state.account.creationReason == null) return emptyTweaks
  return state.account.creationReason.appTweaks
}

const emptyTweaks: AppTweaks = {
  currencyCodes: undefined,
  messages: [],
  plugins: []
}
