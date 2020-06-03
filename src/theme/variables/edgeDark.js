// @flow
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'

const pallete = {
  edgeNavy: '#0D2145',
  edgeMint: '#66EDA8',
  edgeBlue: '#0E4B75',
  edgeBlueOp50: 'rgba(14, 75, 117, .5)',
  darkBlue: '#2F5E89',
  darkBlueNavyGradient1: 'rgba(47,94,137,1)',
  darkBlueNavyGradient2: 'rgba(13,33,69,1)',

  accentBlue: '#0073D9',
  accentOrange: '#F1AA19',
  accentRed: '#E85466',
  accentGreen: '#77C513',

  white: '#FFFFFF',
  whiteOp10: 'rgba(255, 255, 255, .1)',

  darkGray: '#4A5157',
  gray: '#87939E',
  lightGray: '#D9E3ED',
  lightestGray: '#F4F5F6',
  blueGray: '#A4C7DF'
}

export const theme: EdgeTheme = {
  primaryButton: pallete.edgeMint,
  primaryButtonText: pallete.edgeNavy,
  secondaryButtonOutline: pallete.edgeMint,
  secondaryButtonText: pallete.edgeMint,
  selectButtonOutline: pallete.edgeMint,
  selectButtonText: pallete.edgeMint,
  modalBody: pallete.edgeNavy,
  headerText: pallete.white,
  primaryText: pallete.white,
  secondaryText: pallete.blueGray,
  tileBackground: pallete.edgeBlue,
  tileIcon: pallete.edgeMint,
  tileMore: pallete.white,
  lineDivider: pallete.edgeBlue,
  background1: pallete.edgeBlue,
  background2: pallete.edgeNavy,
  cancelButton: pallete.white,
  accentTextPositive: pallete.accentGreen,
  accentTextNegative: pallete.accentRed,
  materialInputBaseColor: pallete.blueGray,
  materialInputTintColor: pallete.blueGray
}
