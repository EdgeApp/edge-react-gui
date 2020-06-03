// @flow

import { theme as darkTheme } from '../theme/variables/edgeDark.js'

export type EdgeTheme = {
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
  materialInputBaseColor: string,
  materialInputTintColor: string
}

export const theme = (state: EdgeTheme = darkTheme) => state
