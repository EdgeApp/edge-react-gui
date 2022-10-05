import { RootState } from '../types/reduxTypes'

export const getDefaultFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  return defaultIsoFiat.replace('iso:', '')
}
