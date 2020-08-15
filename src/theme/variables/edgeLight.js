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
  black: '#000000',
  white: '#FFFFFF',
  whiteBlue: '#EEF3F6',
  lightestBlue: '#D1ECFF',
  edgeNavy: '#0D2145',
  edgeBlue: '#0E4B75',
  edgeMint: '#66EDA8',
  gray: '#87939E',
  lightGray: '#DBDBDB',
  lightestGray: '#F6F6F6',
  mutedBlue: '#2F5E89',
  mutedGray: '#EDEDED',
  accentGreen: '#77C513',
  accentRed: '#E85466',
  accentBlue: '#0073D9',
  accentOrange: '#FF8A00',

  blackOp25: 'rgba(0, 0, 0, .25)',
  blackOp50: 'rgba(0, 0, 0, .5)',
  blackOp10: 'rgba(0, 0, 0, .1)',
  grayOp80: 'rgba(135, 147, 158, .8)',
  whiteOp10: 'rgba(255, 255, 255, 0.1)',
  accentOrangeOp30: 'rgba(241, 170, 25, .3)',
  lightGrayOp75: 'rgba(217, 227, 237, .75)',
  transparent: 'rgba(255, 255, 255, 0)'
}

export const edgeLight: Theme = {
  themeId: 'edgelight',

  rem(size: number): number {
    return Math.round(scale(16) * size)
  },

  // Icons

  icon: palette.black,
  iconTappable: palette.edgeBlue,
  warningIcon: palette.accentOrange, // Not used

  // Background
  backgroundGradientLeft: palette.lightestGray,
  backgroundGradientRight: palette.lightestGray,

  // Modal
  modal: palette.lightestGray,
  modalShadow: palette.blackOp50,
  modalBackgroundShadowOpacity: 0.7,
  modalCloseIcon: palette.edgeMint,
  modalFullGradientLeft: palette.white, // Not used
  modalFullGradientRight: palette.white, // Not used

  // Tile
  listHeaderBackground: palette.white, // Not used
  tileBackground: palette.white,
  tileBackgroundMuted: palette.mutedGray, // Not used
  listSectionHeaderBackground: palette.white, // Not used

  // Text
  primaryText: palette.black,
  secondaryText: palette.gray,
  warningText: palette.accentOrange, // Not used
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeBlue,
  deactivatedText: palette.gray,
  listHeaderText: palette.black, // Not used

  // Header
  headerText: palette.black, // Not used
  hamburgerButton: palette.black, // Not used
  backButton: palette.black, // Not used

  // Buttons
  // Should add palette when pressed
  primaryButtonOutline: palette.transparent,
  primaryButton: palette.edgeBlue,
  primaryButtonText: palette.edgeBlue,
  primaryButtonDeactivated: palette.gray, // Not used

  secondaryButtonOutline: palette.edgeBlue,
  secondaryButton: palette.transparent,
  secondaryButtonText: palette.edgeBlue,

  tertiaryButtonOutline: palette.edgeBlue, // Not used
  tertiaryButton: palette.transparent, // Not used
  tertiaryButtonText: palette.edgeBlue, // Not used

  glassButton: palette.blackOp10, // Not used
  glassButtonDark: palette.blackOp50, // Not used
  glassButtonDarkIcon: palette.white, // Not used
  glassButtonIcon: palette.edgeBlue, // Not used

  dangerButtonOutline: palette.transparent, // Not used
  dangerButton: palette.accentRed, // Not used
  dangerButtonText: palette.white, // Not used

  cardBackground: palette.white, // Not used
  cardShadow: palette.blackOp25, // Not used

  tabBarBackground: palette.white, // Not used
  tabBarIcon: palette.gray, // Not used
  tabBarIconHighlighted: palette.edgeBlue, // Not used

  sliderTabSend: palette.accentRed, // Not used
  sliderTabRequest: palette.accentGreen, // Not used
  sliderTabMore: palette.accentBlue, // Not used

  pinOutline: palette.edgeBlue, // Not used
  pinFilled: palette.edgeBlue, // Not used

  radioButtonOutline: palette.edgeNavy, // Not used
  radioButtonFilled: palette.edgeBlue, // Not used

  toggleButton: palette.accentGreen,
  toggleButtonOff: palette.gray,
  toggleButtonThumb: palette.white, // Not used

  warningBubble: palette.accentOrange, // Not used

  // Confirmation slider
  confirmationSlider: palette.blackOp10, // Not used
  confirmationSliderText: palette.edgeBlue, // Not used
  confirmationSliderArrow: palette.white, // Not used
  confirmationSliderThumb: palette.edgeBlue, // Not used
  confirmationSliderTextDeactivated: palette.gray, // Not used
  confirmationThumbDeactivated: palette.gray, // Not used

  // Lines
  lineDivider: palette.edgeBlue, // Not used
  textInputLine: palette.gray, // Not used
  orLine: palette.gray, // Not used
  tileDivider: palette.gray, // Not used

  // Notifications
  notificationBackground: palette.grayOp80, // Not used
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
  settingsRowBackground: palette.white,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderBackground: palette.lightGray,
  settingsRowSubHeader: palette.transparent,

  // Misc
  // Remove defaults when lightMode is implemented
  keyboardTopViewBackgroundLight: palette.white,
  keyboardTopViewBackgroundDark: palette.edgeBlue,
  keyboardTopViewTextLight: palette.accentBlue,
  keyboardTopViewTextDark: palette.white,
  datetimepickerBackgroundLight: palette.white,
  datetimepickerBackgroundDark: palette.edgeBlue,
  pressedOpacity: 0.25, // Should be removed when press colors are given to buttons and links // Not used

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
