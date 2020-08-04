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
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },

  // Icons
  icon: palette.white,
  iconTappable: palette.edgeMint,
  warningIcon: palette.accentOrange,

  // Background
  backgroundGradientLeft: palette.darkBlue,
  backgroundGradientRight: palette.edgeNavy,

  // Modal
  modal: palette.royalBlue,
  modalShadow: palette.blackOp50,
  modalBackgroundShadowOpacity: 0.7,
  modalCloseIcon: palette.edgeMint,

  // Tile
  listHeaderBackground: palette.edgeNavy,
  tileBackground: palette.edgeBlue,
  tileBackgroundMuted: palette.mutedBlue, // change from mutedTileBackground

  // Text
  primaryText: palette.white,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeMint,
  deactivatedText: palette.gray,

  // Header
  headerText: palette.white,
  hamburgerButton: palette.white,
  backButton: palette.white,

  // Buttons
  // Should add palette when pressed
  primaryButtonOutline: palette.transparent,
  primaryButton: palette.edgeMint,
  primaryButtonText: palette.edgeBlue,
  primaryButtonDeactivated: palette.gray,

  secondaryButtonOutline: palette.edgeMint,
  secondaryButton: palette.transparent,
  secondaryButtonText: palette.edgeMint,

  tertiaryButtonOutline: palette.edgeMint,
  tertiaryButton: palette.transparent,
  tertiaryButtonText: palette.edgeMint,

  glassButton: palette.whiteOp10,
  glassButtonIcon: palette.white,
  glassButtonDark: palette.blackOp50,
  glassButtonDarkIcon: palette.white,

  cardBackground: palette.edgeBlue,
  cardShadow: palette.blackOp25,

  tabBarBackground: palette.edgeNavy,
  tabBarIcon: palette.white,
  tabBarIconHighlighted: palette.edgeMint,

  sendTab: palette.accentRed, // sliderTabSend
  requestTab: palette.accentGreen, // "
  moreTab: palette.accentBlue, // "

  pinOutline: palette.white,
  pinFilled: palette.white,

  radioButtonOutline: palette.lightGray,
  radioButtonFilled: palette.edgeMint,

  toggleButton: palette.edgeMint,
  toggleButtonOff: palette.gray,
  toggleButtonThumb: palette.white,

  warningBubble: palette.accentOrange,

  // Confirmation slider
  confirmationSlider: palette.whiteOp10,
  confirmationSliderText: palette.edgeMint,
  confirmationSliderArrow: palette.edgeBlue,
  confirmationSliderThumb: palette.edgeMint,
  confirmationSliderTextDeactivated: palette.gray,
  confirmationThumbDeactivated: palette.gray,

  // Lines
  lineDivider: palette.blueGray, // change from listDivider
  textInputLine: palette.blueGray,
  orLine: palette.blueGray,
  tileDivider: palette.blueGray,

  // Notifications
  notificationBackground: palette.lightGrayOp75,
  messageBanner: palette.grayOp80,

  // Alert Modal
  securityAlertModalHeaderIcon: palette.accentOrange,
  securityAlertModalRowBorder: palette.lightGray,
  securityAlertModalWarningIcon: palette.accentOrange,
  securityAlertModalDangerIcon: palette.accentRed,
  securityAlertModalBackground: palette.white,
  securityAlertModalText: palette.black,
  securityAlertModalLine: palette.lightGray,
  securityAlertModalHeaderIconShadow: palette.accentOrangeOp30,

  // Settings Row
  settingsRowBackground: palette.edgeBlue,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderBackground: palette.edgeNavy,
  settingsRowSubHeader: palette.transparent,

  // Misc
  // Remove defaults when lightMode is implemented
  keyboardTopViewBackgroundDefault: palette.white,
  keyboardTopViewBackgroundDark: palette.edgeBlue,
  keyboardTopViewTextDefault: palette.accentBlue,
  keyboardTopViewTextDark: palette.white,
  datetimepickerBackgroundDefault: palette.white,
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
