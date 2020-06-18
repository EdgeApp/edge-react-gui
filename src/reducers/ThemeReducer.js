// @flow

import { theme as darkTheme } from '../theme/variables/edgeDark.js'
import { scale } from '../util/scaling.js'

export type EdgeThemeRaw = {
  primaryButton: string,
  primaryButtonText: string,
  secondaryButtonOutline: string,
  secondaryButtonText: string,
  selectButtonOutline: string,
  selectButtonText: string,
  modalBody: string,
  headerText: string,
  primaryText: string,
  secondaryText: string,
  tileBackground: string,
  tileIcon: string,
  tileMore: string,
  lineDivider: string,
  background1: string,
  background2: string,
  cancelButton: string,
  accentTextPositive: string,
  accentTextNegative: string,
  remMultiplier: number
}

export type EdgeTheme = EdgeThemeRaw & { rem: (rem: number) => number }

const makeRem = (theme: EdgeThemeRaw) => (rem: number) => Math.round(rem * scale(theme.remMultiplier))

const initialState = {
  ...darkTheme,
  rem: makeRem(darkTheme)
}

export const theme = (state: EdgeTheme = initialState) => state
