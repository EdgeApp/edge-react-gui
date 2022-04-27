// @flow

import { Platform } from 'react-native'

import fioAddressLogo from '../../assets/images/details_fioAddress.png'
import edgeMark from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import guiPluginLogoBitaccess from '../../assets/images/guiPlugins/guiPluginLogoBitaccessDark.png'
import guiPluginLogoMoonpay from '../../assets/images/guiPlugins/guiPluginLogoMoonpayDark.png'
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import paymentTypeLogoAuspost from '../../assets/images/paymentTypes/paymentTypeLogoAuspost.png'
import paymentTypeLogoBankgirot from '../../assets/images/paymentTypes/paymentTypeLogoBankgirot.png'
import paymentTypeLogoBankTransfer from '../../assets/images/paymentTypes/paymentTypeLogoBankTransfer.png'
import paymentTypeLogoCash from '../../assets/images/paymentTypes/paymentTypeLogoCash.png'
import paymentTypeLogoCreditCard from '../../assets/images/paymentTypes/paymentTypeLogoCreditCard.png'
import paymentTypeLogoDebitCard from '../../assets/images/paymentTypes/paymentTypeLogoDebitCard.png'
import paymentTypeLogoFasterPayments from '../../assets/images/paymentTypes/paymentTypeLogoFasterPayments.png'
import paymentTypeLogoGiftCard from '../../assets/images/paymentTypes/paymentTypeLogoGiftCard.png'
import paymentTypeLogoIdeal from '../../assets/images/paymentTypes/paymentTypeLogoIdeal.png'
import paymentTypeLogoInterac from '../../assets/images/paymentTypes/paymentTypeLogoInterac.png'
import paymentTypeLogoNewsagent from '../../assets/images/paymentTypes/paymentTypeLogoNewsagent.png'
import paymentTypeLogoPayid from '../../assets/images/paymentTypes/paymentTypeLogoPayid.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoSofort from '../../assets/images/paymentTypes/paymentTypeLogoSofort.png'
import paymentTypeLogoSwish from '../../assets/images/paymentTypes/paymentTypeLogoSwish.png'
import paymentTypeLogoUpi from '../../assets/images/paymentTypes/paymentTypeLogoUpi.png'
import walletListSlidingTutorial from '../../assets/images/tutorials/walletList_sliding_dark.gif'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { type Theme, textNoShadow, themeNoShadow } from '../../types/Theme.js'
import { scale } from '../../util/scaling.js'
import { PLATFORM } from './platform'

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
  whiteOp05: 'rgba(255, 255, 255, .05)',
  whiteOp75: 'rgba(255, 255, 255, .75)',

  grayOp80: 'rgba(135, 147, 158, .8)',
  accentOrangeOp30: 'rgba(241, 170, 25, .3)',
  lightGrayOp75: 'rgba(217, 227, 237, .75)',
  transparent: 'rgba(255, 255, 255, 0)',

  // Fonts
  SFUITextRegular: 'SF-UI-Text-Regular',
  QuicksandLight: 'Quicksand-Light',
  QuicksandRegular: 'Quicksand-Regular',
  QuicksandMedium: 'Quicksand-Medium',
  QuicksandSemiBold: 'Quicksand-SemiBold',
  QuicksandBold: 'Quicksand-Bold'
}

export const edgeDark: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: true,
  preferPrimaryButton: false,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.white,
  iconTappable: palette.edgeMint,
  iconDeactivated: palette.whiteOp75,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  transactionListIconBackground: palette.darkBlue,
  buySellCustomPluginModalIcon: palette.darkBlue,

  // Background
  backgroundGradientColors: [palette.edgeNavy, palette.darkBlue],
  backgroundImageServerUrls: ['https://content.edge.app'],
  backgroundImage: undefined,

  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0.3,

  // Modal
  modal: palette.edgeNavy,
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,

  sideMenuColor: palette.edgeNavy,
  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandMedium,

  // Tile
  // listHeaderBackground: palette.edgeNavy,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,
  // listSectionHeaderBackground: palette.edgeNavy,

  // WalletList
  walletListBackground: palette.edgeBlue,
  walletListMutedBackground: palette.mutedBlue,

  // Text
  primaryText: palette.white,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeMint,
  deactivatedText: palette.gray,
  // listHeaderText: palette.white,

  // Header
  headerIcon: edgeMark,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 0.25,
  addButtonFont: palette.QuicksandMedium,

  keypadButtonOutline: palette.edgeMint,
  keypadButtonOutlineWidth: 1,
  keypadButton: [palette.transparent, palette.transparent],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.edgeMint,
  keypadButtonTextShadow: textNoShadow,
  keypadButtonShadow: themeNoShadow,
  keypadButtonBorderRadiusRem: 0.25,
  keypadButtonFontSizeRem: 1,
  keypadButtonFont: palette.QuicksandMedium,

  primaryButtonOutline: palette.transparent,
  primaryButtonOutlineWidth: 1,
  primaryButton: [palette.edgeMint, palette.edgeMint],
  primaryButtonColorStart: { x: 0, y: 0 },
  primaryButtonColorEnd: { x: 1, y: 0 },
  primaryButtonText: palette.edgeBlue,
  primaryButtonTextShadow: textNoShadow,
  primaryButtonShadow: themeNoShadow,
  primaryButtonFontSizeRem: 1,
  primaryButtonFont: palette.QuicksandRegular,

  secondaryButtonOutline: palette.edgeMint,
  secondaryButtonOutlineWidth: 1,
  secondaryButton: [palette.transparent, palette.transparent],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.edgeMint,
  secondaryButtonTextShadow: textNoShadow,
  secondaryButtonShadow: themeNoShadow,
  secondaryButtonFontSizeRem: 1,
  secondaryButtonFont: palette.QuicksandRegular,

  escapeButtonOutline: palette.transparent,
  escapeButtonOutlineWidth: 0,
  escapeButton: [palette.transparent, palette.transparent],
  escapeButtonColorStart: { x: 0, y: 0 },
  escapeButtonColorEnd: { x: 1, y: 1 },
  escapeButtonText: palette.edgeMint,
  escapeButtonTextShadow: textNoShadow,
  escapeButtonShadow: themeNoShadow,
  escapeButtonFontSizeRem: 1,
  escapeButtonFont: palette.QuicksandRegular,

  // Dropdown colors:
  dropdownWarning: palette.accentOrange,
  dropdownError: palette.accentRed,
  dropdownText: palette.white,

  // Card
  // cardBackground: palette.edgeBlue,
  // cardShadow: palette.blackOp25,
  cardBorder: 1,
  cardBorderColor: palette.whiteOp10,
  cardBorderRadius: 4,

  tabBarBackground: [palette.edgeNavy, palette.edgeNavy],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
  tabBarTopOutlineColors: [palette.edgeNavy, palette.edgeNavy],
  tabBarIcon: palette.white,
  tabBarIconHighlighted: palette.edgeMint,

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

  // pinOutline: palette.white,
  // pinFilled: palette.white,

  // radioButtonOutline: palette.lightGray,
  // radioButtonFilled: palette.edgeMint,

  toggleButton: palette.edgeMint,
  toggleButtonOff: palette.gray,
  // toggleButtonThumb: palette.white,

  // warningBubble: palette.accentOrange,

  // Confirmation slider
  confirmationSlider: palette.whiteOp05,
  confirmationSliderText: palette.white,
  confirmationSliderArrow: palette.edgeBlue,
  confirmationSliderThumb: palette.edgeMint,
  confirmationSliderTextDeactivated: palette.gray,
  confirmationThumbDeactivated: palette.gray,
  confirmationSliderWidth: PLATFORM.deviceWidth >= 340 ? 295 : PLATFORM.deviceWidth - 45,
  confirmationSliderThumbWidth: 55,

  // Lines
  lineDivider: palette.whiteOp10,
  titleLineDivider: palette.blueGray,
  // textInputLine: palette.blueGray,
  // orLine: palette.blueGray,
  // tileDivider: palette.blueGray,
  thinLineWidth: 1,
  mediumLineWidth: 2,

  // DividerLine component
  dividerLineHeight: 1,
  dividerLineColors: [palette.whiteOp10, palette.whiteOp10],

  // Notifications
  // notificationBackground: palette.lightGrayOp75,
  // messageBanner: palette.grayOp80,
  // bubble: palette.whiteOp10,

  // Alert Modal
  // securityAlertModalHeaderIcon: palette.accentOrange,
  // securityAlertModalRowBorder: palette.lightGray,
  // securityAlertModalWarningIcon: palette.accentOrange,
  // securityAlertModalDangerIcon: palette.accentRed,
  // securityAlertModalBackground: palette.white,
  // securityAlertModalText: palette.black,
  // securityAlertModalLine: palette.lightGray,
  // securityAlertModalHeaderIconShadow: palette.accentOrangeOp30,

  // Settings Row
  settingsRowBackground: palette.transparent,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderBackground: palette.edgeNavy,
  settingsRowHeaderFont: palette.QuicksandMedium,
  settingsRowHeaderFontSizeRem: 1,
  settingsRowSubHeader: palette.transparent,

  // Native iOS date modal:
  dateModalTextLight: palette.accentBlue,
  dateModalTextDark: palette.white,
  dateModalBackgroundLight: palette.white,
  dateModalBackgroundDark: palette.edgeBlue,

  // Wallet Icon Progress
  walletProgressIconFill: palette.edgeMint,
  walletProgressIconDone: palette.white,

  // Misc
  // pressedOpacity: 0.25, // Should be removed when press colors are given to buttons and links
  searchListRefreshControlIndicator: palette.transparent,
  clipboardPopupText: palette.black,
  flipInputBorder: palette.blueGray,

  // Fonts
  fontFaceDefault: palette.QuicksandRegular,
  fontFaceMedium: palette.QuicksandMedium,
  fontFaceBold: palette.QuicksandBold,
  fontFaceSymbols: Platform.OS === 'android' ? palette.SFUITextRegular : palette.QuicksandRegular,

  // TouchableHighlights underlay
  underlayColor: palette.white,
  underlayOpacity: 0.95,

  // Tutorials
  tutorialModalUnderlay: palette.transparent,

  // QR code
  qrForegroundColor: palette.black,
  qrBackgroundColor: palette.white,

  // Picker Color
  pickerTextDark: palette.white,
  pickerTextLight: palette.black,

  // Input Accessory
  inputAccessoryBackground: palette.white,
  inputAccessoryText: palette.accentBlue,

  // Outline Text Input
  outlineTextInputColor: palette.transparent,
  outlineTextInputTextColor: palette.white,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.blueGray,
  outlineTextInputBorderColorFocused: palette.edgeMint,

  // Animation
  fadeDisable: palette.gray,

  // Images
  iconServerBaseUri: EDGE_CONTENT_SERVER_URI,

  paymentTypeLogoApplePay: paymentTypeLogoApplePay,
  paymentTypeLogoAuspost: paymentTypeLogoAuspost,
  paymentTypeLogoBankgirot: paymentTypeLogoBankgirot,
  paymentTypeLogoBankTransfer: paymentTypeLogoBankTransfer,
  paymentTypeLogoCash: paymentTypeLogoCash,
  paymentTypeLogoCreditCard: paymentTypeLogoCreditCard,
  paymentTypeLogoDebitCard: paymentTypeLogoDebitCard,
  paymentTypeLogoFasterPayments: paymentTypeLogoFasterPayments,
  paymentTypeLogoGiftCard: paymentTypeLogoGiftCard,
  paymentTypeLogoIdeal: paymentTypeLogoIdeal,
  paymentTypeLogoInterac: paymentTypeLogoInterac,
  paymentTypeLogoNewsagent: paymentTypeLogoNewsagent,
  paymentTypeLogoPayid: paymentTypeLogoPayid,
  paymentTypeLogoPoli: paymentTypeLogoPoli,
  paymentTypeLogoSofort: paymentTypeLogoSofort,
  paymentTypeLogoSwish: paymentTypeLogoSwish,
  paymentTypeLogoUpi: paymentTypeLogoUpi,

  primaryLogo: edgeLogo,
  fioAddressLogo: fioAddressLogo,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoBitaccess: guiPluginLogoBitaccess,
  guiPluginLogoMoonpay: guiPluginLogoMoonpay
}
