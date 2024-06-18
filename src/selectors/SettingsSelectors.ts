import { RootState } from '../types/reduxTypes'
import { removeIsoPrefix } from '../util/utils'

export const getDefaultFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  return removeIsoPrefix(defaultIsoFiat)
}
