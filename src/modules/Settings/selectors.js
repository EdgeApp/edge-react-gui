// @flow

import { type RootState } from '../../types/reduxTypes.js'

export const getDefaultFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  return defaultIsoFiat.replace('iso:', '')
}
