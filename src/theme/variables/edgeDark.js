// @flow

import { Platform } from 'react-native'

import changellyLogo from '../../assets/images/exchange/settingsExchangeChangelly.png'
import changenowLogo from '../../assets/images/exchange/settingsExchangeChangenow.png'
import coinswitchLogo from '../../assets/images/exchange/settingsExchangeCoinswitch.png'
import defaultLogo from '../../assets/images/exchange/settingsExchangeDefault.png'
import faastLogo from '../../assets/images/exchange/settingsExchangeFaast.png'
import foxExchangeLogo from '../../assets/images/exchange/settingsExchangeFoxExchange.png'
import godexLogo from '../../assets/images/exchange/settingsExchangeGodex.png'
import switchainLogo from '../../assets/images/exchange/settingsExchangeSwitchain.png'
import totleLogo from '../../assets/images/exchange/settingsExchangeTotle.png'
import { type Theme } from '../../types/Theme.js'
import { scale } from '../../util/scaling.js'

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  royalBlue: '#003B65',
  darkBlue: '#0C446A',
  edgeNavy: '#0D2145',
  edgeBlue: '#0E4B75',
  edgeMint: '#66EDA8',
  blueGray: '#A4C7DF',
  gray: '#87939E',
  lightGray: '#D9E3ED',
  mutedBlue: '#2F5E89',
  accentGreen: '#77C513',
  accentRed: '#E85466',
  accentBlue: '#0073D9',
  accentOrange: '#F1AA19',
  darkBlueNavyGradient1: '#0C446A',
  darkBlueNavyGradient2: '#0D2145',

  blackOp25: 'rgba(0, 0, 0, .25)',
  blackOp50: 'rgba(0, 0, 0, .5)',

  whiteOp10: 'rgba(255, 255, 255, .1)',

  grayOp80: 'rgba(135, 147, 158, .8)',
  accentOrangeOp30: 'rgba(241, 170, 25, .3)',
  lightGrayOp75: 'rgba(217, 227, 237, .75)',
  transparent: 'rgba(255, 255, 255, 0)'
}

export const edgeDark: Theme = {
  themeId: 'edgedark',

  rem(size: number): number {
    return Math.round(scale(16) * size)
  },

  // Icons
  icon: palette.white,
  iconTappable: palette.edgeMint,
  warningIcon: palette.accentOrange, // Not used

  // Background
  backgroundGradientLeft: palette.darkBlue,
  backgroundGradientRight: palette.edgeNavy,

  // Modal
  modal: palette.royalBlue,
  modalShadow: palette.blackOp50,
  modalBackgroundShadowOpacity: 0.7,
  modalCloseIcon: palette.edgeMint,
  modalFullGradientLeft: palette.darkBlue, // Not used
  modalFullGradientRight: palette.edgeNavy, // Not used

  // Tile
  listHeaderBackground: palette.edgeNavy, // Not used
  tileBackground: palette.edgeBlue, // Not used
  tileBackgroundMuted: palette.mutedBlue,
  listSectionHeaderBackground: palette.edgeNavy, // Not used

  // Text
  primaryText: palette.white,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange, // Not used
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeMint,
  deactivatedText: palette.gray,
  listHeaderText: palette.white, // Not used

  // Header
  headerText: palette.white, // Not used
  hamburgerButton: palette.white, // Not used
  backButton: palette.white, // Not used

  // Buttons
  // Should add palette when pressed
  primaryButtonOutline: palette.transparent,
  primaryButton: palette.edgeMint,
  primaryButtonText: palette.edgeBlue,
  primaryButtonDeactivated: palette.gray, // Not used

  secondaryButtonOutline: palette.edgeMint,
  secondaryButton: palette.transparent,
  secondaryButtonText: palette.edgeMint,

  tertiaryButtonOutline: palette.edgeMint, // Not used
  tertiaryButton: palette.transparent, // Not used
  tertiaryButtonText: palette.edgeMint, // Not used

  glassButton: palette.whiteOp10, // Not used
  glassButtonIcon: palette.white, // Not used
  glassButtonDark: palette.blackOp50, // Not used
  glassButtonDarkIcon: palette.white, // Not used

  dangerButtonOutline: palette.transparent, // Not used
  dangerButton: palette.white, // Not used
  dangerButtonText: palette.accentRed, // Not used

  cardBackground: palette.edgeBlue, // Not used
  cardShadow: palette.blackOp25, // Not used

  tabBarBackground: palette.edgeNavy, // Not used
  tabBarIcon: palette.white, // Not used
  tabBarIconHighlighted: palette.edgeMint, // Not used

  sliderTabSend: palette.accentRed, // Not used
  sliderTabRequest: palette.accentGreen, // Not used
  sliderTabMore: palette.accentBlue, // Not used

  pinOutline: palette.white, // Not used
  pinFilled: palette.white, // Not used

  radioButtonOutline: palette.lightGray, // Not used
  radioButtonFilled: palette.edgeMint, // Not used

  toggleButton: palette.edgeMint,
  toggleButtonOff: palette.gray,
  toggleButtonThumb: palette.white, // Not used

  warningBubble: palette.accentOrange, // Not used

  // Confirmation slider
  confirmationSlider: palette.whiteOp10, // Not used
  confirmationSliderText: palette.edgeMint, // Not used
  confirmationSliderArrow: palette.edgeBlue, // Not used
  confirmationSliderThumb: palette.edgeMint, // Not used
  confirmationSliderTextDeactivated: palette.gray, // Not used
  confirmationThumbDeactivated: palette.gray, // Not used

  // Lines
  lineDivider: palette.blueGray, // Not used
  textInputLine: palette.blueGray, // Not used
  orLine: palette.blueGray, // Not used
  tileDivider: palette.blueGray, // Not used

  // Notifications
  notificationBackground: palette.lightGrayOp75, // Not used
  messageBanner: palette.grayOp80, // Not used
  bubble: palette.whiteOp10, // Not used

  // Alert Modal
  securityAlertModalHeaderIcon: palette.accentOrange, // Not used
  securityAlertModalRowBorder: palette.lightGray, // Not used
  securityAlertModalWarningIcon: palette.accentOrange, // Not used
  securityAlertModalDangerIcon: palette.accentRed, // Not used
  securityAlertModalBackground: palette.white, // Not used
  securityAlertModalText: palette.black, // Not used
  securityAlertModalLine: palette.lightGray, // Not used
  securityAlertModalHeaderIconShadow: palette.accentOrangeOp30, // Not used

  // Settings Row
  settingsRowBackground: palette.edgeBlue,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderBackground: palette.edgeNavy,
  settingsRowSubHeader: palette.transparent,

  // Misc
  // Remove defaults when lightMode is implemented
  keyboardTopViewBackgroundLight: palette.white,
  keyboardTopViewBackgroundDark: palette.edgeBlue,
  keyboardTopViewTextLight: palette.accentBlue,
  keyboardTopViewTextDark: palette.white,
  datetimepickerBackgroundLight: palette.white,
  datetimepickerBackgroundDark: palette.edgeBlue,
  pressedOpacity: 0.25, // Should be removed when press colors are given to buttons and links

  // Fonts
  fontFaceDefault: 'SourceSansPro-Black',
  fontFaceBold: 'SourceSansPro-Bold',
  fontFaceSymbols: Platform.OS === 'android' ? 'SF-UI-Text-Regular' : 'SourceSansPro-Black',

  // Images
  settingsChangellyLogo: changellyLogo,
  settingsChangenowLogo: changenowLogo,
  settingsCoinswitchLogo: coinswitchLogo,
  settingsDefaultLogo: defaultLogo,
  settingsFaastLogo: faastLogo,
  settingsFoxExchangeLogo: foxExchangeLogo,
  settingsGodexLogo: godexLogo,
  settingsSwitchainLogo: switchainLogo,
  settingsTotleLogo: totleLogo
}
