// @flow

import type {State} from '../../../ReduxTypes'

export const getSubcategories = (state: State) => {
  return state.ui.scenes.transactionDetails.subcategories
}
