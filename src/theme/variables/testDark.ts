import { Dimensions, Platform } from 'react-native'

import backgroundImage from '../../assets/images/backgrounds/login_bg.jpg'
import fioAddressLogo from '../../assets/images/details_fioAddress.png'
import guiPluginLogoMoonpay from '../../assets/images/guiPlugins/guiPluginLogoMoonpayDark.png'
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import paymentTypeLogoAuspost from '../../assets/images/paymentTypes/paymentTypeLogoAuspost.png'
import paymentTypeLogoBankTransfer from '../../assets/images/paymentTypes/paymentTypeLogoBankTransfer.png'
import paymentTypeLogoCash from '../../assets/images/paymentTypes/paymentTypeLogoCash.png'
import paymentTypeLogoCreditCard from '../../assets/images/paymentTypes/paymentTypeLogoCreditCard.png'
import paymentTypeLogoDebitCard from '../../assets/images/paymentTypes/paymentTypeLogoDebitCard.png'
import paymentTypeLogoFasterPayments from '../../assets/images/paymentTypes/paymentTypeLogoFasterPayments.png'
import paymentTypeLogoGiftCard from '../../assets/images/paymentTypes/paymentTypeLogoGiftCard.png'
import paymentTypeLogoGooglePay from '../../assets/images/paymentTypes/paymentTypeLogoGooglePay.png'
import paymentTypeLogoIdeal from '../../assets/images/paymentTypes/paymentTypeLogoIdeal.png'
import paymentTypeLogoInterac from '../../assets/images/paymentTypes/paymentTypeLogoInterac.png'
import paymentTypeLogoPayid from '../../assets/images/paymentTypes/paymentTypeLogoPayid.png'
import paymentTypeLogoPaynow from '../../assets/images/paymentTypes/paymentTypeLogoPaynow.png'
import paymentTypeLogoPix from '../../assets/images/paymentTypes/paymentTypeLogoPix.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoSofort from '../../assets/images/paymentTypes/paymentTypeLogoSofort.png'
import paymentTypeLogoUpi from '../../assets/images/paymentTypes/paymentTypeLogoUpi.png'
import paymentTypeVisa from '../../assets/images/paymentTypes/paymentTypeVisa.png'
import walletListSlidingTutorial from '../../assets/images/tutorials/walletList_sliding_dark.gif'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { textNoShadow, Theme, themeNoShadow } from '../../types/Theme'
import { scale } from '../../util/scaling'

const palette = {
  white: '#FDF2D5',
  black: '#000000',
  deepPurple: '#1A043D',
  darkPurple1: '#2C0F60',
  darkPurple2: '#280363',
  darkPurple3: '#210449',
  plainPurple: '#532499',
  glowPurple: '#FA00FF',
  lightPurple: '#FAaaFF',
  royalBlue: '#003B65',
  darkBlue: '#0C446A',
  edgeNavy: '#0D2145',
  edgeBlue: '#0E4B75',
  darkMint: '#089e73',
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
  QuicksandBold: 'Quicksand-Bold',

  // UI4 palette
  darkTeal: 'rgb(0,35,45)',
  veryDarkTeal: 'rgb(10, 13, 15)',

  teal: 'rgb(22, 50, 58)',
  blackOp65: 'rgba(0, 0, 0, .65)'
}

const deviceWidth = Dimensions.get('window').width

export const testDark: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: true,
  preferPrimaryButton: true,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.white,
  iconTappable: palette.glowPurple,
  iconDeactivated: palette.whiteOp75,
  dangerIcon: palette.accentRed,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  transactionListIconBackground: palette.darkBlue,
  buySellCustomPluginModalIcon: palette.darkBlue,

  // Background
  backgroundGradientColors: [palette.deepPurple, palette.darkPurple2],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 0, y: 1 },
  backgroundImageServerUrls: ['https://content-test.edge.app'],
  backgroundImage,
  backgroundLoadingOverlay: 'rgba(123,123,123,.2)',

  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0.3,

  // Modal
  modal: palette.edgeNavy,
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.glowPurple,
  modalBorderWidth: 4,
  modalBorderRadiusRem: 2,

  sideMenuColor: palette.edgeNavy,
  sideMenuBorderColor: palette.glowPurple,
  sideMenuBorderWidth: 4,
  sideMenuFont: palette.QuicksandBold,

  // Tile
  // listHeaderBackground: palette.edgeNavy,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [palette.transparent],

  // WalletList
  walletListBackground: palette.edgeBlue,
  walletListMutedBackground: palette.mutedBlue,

  // Text
  primaryText: palette.lightPurple,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeMint,
  deactivatedText: palette.gray,
  emphasizedText: palette.edgeMint,
  // listHeaderText: palette.white,

  // Header
  headerIcon: fioAddressLogo,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 0.5,
  addButtonFont: palette.QuicksandBold,

  keypadButtonOutline: palette.glowPurple,
  keypadButtonOutlineWidth: 1.5,
  keypadButton: [palette.plainPurple, palette.darkPurple1],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.lightPurple,
  keypadButtonTextShadow: {
    textShadowColor: palette.edgeMint,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  keypadButtonShadow: {
    shadowColor: palette.edgeMint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 3
  },
  keypadButtonBorderRadiusRem: 0.5,
  keypadButtonFontSizeRem: 2,
  keypadButtonFont: palette.QuicksandMedium,

  primaryButtonOutline: palette.glowPurple,
  primaryButtonOutlineWidth: 2,
  primaryButton: [palette.plainPurple, palette.darkPurple1],
  primaryButtonColorStart: { x: 0.5, y: 0 },
  primaryButtonColorEnd: { x: 0.5, y: 1 },
  primaryButtonText: palette.lightPurple,
  primaryButtonTextShadow: {
    textShadowColor: palette.edgeMint,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  primaryButtonShadow: {
    shadowColor: palette.edgeMint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 3
  },
  primaryButtonFontSizeRem: 1.25,
  primaryButtonFont: palette.QuicksandBold,

  secondaryButtonOutline: palette.glowPurple,
  secondaryButtonOutlineWidth: 2,
  secondaryButton: [palette.transparent, palette.transparent],
  secondaryButtonColorStart: { x: 0.5, y: 0 },
  secondaryButtonColorEnd: { x: 0.5, y: 1 },
  secondaryButtonText: palette.glowPurple,
  secondaryButtonTextShadow: textNoShadow,
  secondaryButtonShadow: themeNoShadow,
  secondaryButtonFontSizeRem: 1,
  secondaryButtonFont: palette.QuicksandLight,

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

  pinUsernameButtonOutline: palette.white,
  pinUsernameButtonOutlineWidth: 0.5,
  pinUsernameButton: [palette.edgeMint, palette.transparent],
  pinUsernameButtonColorStart: { x: 0, y: 0 },
  pinUsernameButtonColorEnd: { x: 1, y: 1 },
  pinUsernameButtonText: palette.accentRed,
  pinUsernameButtonTextShadow: { textShadowColor: palette.edgeMint, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  pinUsernameButtonShadow: { shadowColor: palette.edgeMint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 3 },
  pinUsernameButtonBorderRadiusRem: 1,
  pinUsernameButtonFontSizeRem: 1.5,
  pinUsernameButtonFont: palette.QuicksandRegular,

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

  tabBarBackground: [palette.edgeNavy, palette.edgeMint],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
  tabBarTopOutlineColors: [palette.edgeNavy, palette.edgeMint],
  tabBarIcon: palette.white,
  tabBarIconHighlighted: palette.edgeMint,

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

  shimmerBackgroundColor: palette.whiteOp05,
  shimmerBackgroundHighlight: palette.whiteOp10,

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
  confirmationSliderWidth: deviceWidth >= 340 ? 295 : deviceWidth - 45,
  confirmationSliderThumbWidth: 55,

  // Lines
  lineDivider: palette.whiteOp10,
  titleLineDivider: palette.blueGray,
  // textInputLine: palette.blueGray,
  // orLine: palette.blueGray,
  // tileDivider: palette.blueGray,
  thinLineWidth: 1,
  mediumLineWidth: 2,
  thickLineWidth: 3,

  // DividerLine component
  dividerLineHeight: 2,
  dividerLineColors: [palette.edgeMint, palette.edgeNavy],

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
  settingsRowHeaderBackground: [palette.edgeNavy, palette.edgeMint],
  settingsRowHeaderBackgroundStart: { x: 0, y: 0 },
  settingsRowHeaderBackgroundEnd: { x: 1, y: 1 },
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

  // TouchableHighlights overlay
  overlayDisabledColor: palette.blackOp50,
  overlayDisabledTextColor: palette.white,

  // Tutorials
  tutorialModalUnderlay: palette.transparent,

  // QR code
  qrForegroundColor: palette.black,
  qrBackgroundColor: palette.white,

  // Picker Color
  pickerText: palette.white,

  // Native Android components like Pickers need specific text colors that
  // contrast with the OS light or dark theme
  nativeComponentTextLight: palette.black,
  nativeComponentTextDark: palette.white,

  // Input Accessory
  inputAccessoryBackground: palette.white,
  inputAccessoryText: palette.accentBlue,

  // Outline Text Input
  outlineTextInputColor: palette.darkPurple3,
  outlineTextInputTextColor: palette.lightPurple,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.darkPurple1,
  outlineTextInputBorderColorDisabled: palette.gray,
  outlineTextInputBorderColorFocused: palette.glowPurple,
  outlineTextInputLabelColor: palette.white,
  outlineTextInputLabelColorDisabled: palette.gray,
  outlineTextInputLabelColorFocused: palette.black,

  // Simple Text Input
  textInputTextColor: palette.gray,
  textInputTextColorDisabled: palette.white,
  textInputTextColorFocused: palette.white,
  textInputBackgroundColor: palette.edgeNavy,
  textInputBackgroundColorDisabled: palette.edgeNavy,
  textInputBackgroundColorFocused: palette.edgeNavy,
  textInputBorderColor: palette.mutedBlue,
  textInputBorderColorDisabled: palette.gray,
  textInputBorderColorFocused: palette.edgeMint,
  textInputBorderWidth: 1,
  textInputBorderRadius: 100,
  textInputIconColor: palette.mutedBlue,
  textInputIconColorDisabled: palette.gray,
  textInputIconColorFocused: palette.edgeMint,
  textInputPlaceholderColor: palette.gray,
  textInputPlaceholderColorDisabled: palette.gray,
  textInputPlaceholderColorFocused: palette.edgeMint,

  // Animation
  fadeDisable: palette.gray,

  // Images
  iconServerBaseUri: EDGE_CONTENT_SERVER_URI,

  paymentTypeLogoApplePay,
  paymentTypeLogoAuspost,
  paymentTypeLogoBankTransfer,
  paymentTypeLogoCash,
  paymentTypeLogoCreditCard,
  paymentTypeLogoDebitCard,
  paymentTypeLogoFasterPayments,
  paymentTypeLogoGiftCard,
  paymentTypeLogoGooglePay,
  paymentTypeLogoIdeal,
  paymentTypeLogoInterac,
  paymentTypeLogoPayid,
  paymentTypeLogoPaynow,
  paymentTypeLogoPix,
  paymentTypeLogoPoli,
  paymentTypeLogoSofort,
  paymentTypeLogoUpi,
  paymentTypeVisa,

  fioAddressLogo: fioAddressLogo,
  primaryLogo: paymentTypeLogoPayid,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoMoonpay: guiPluginLogoMoonpay,

  // UI 4.0:
  buttonBorderRadiusRemUi4: 2,
  buttonFontSizeRemUi4: 1,

  buttonPrimaryUi4: {
    textStyle: {
      fontFamily: palette.QuicksandMedium,
      color: palette.black
    },
    gradientProps: {
      colors: [palette.darkMint, palette.edgeMint],
      end: { x: 1, y: 0 },
      start: { x: 0, y: 0 }
    },
    shadowParams: {
      shadowColor: palette.white,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 2
    },
    containerStyle: {
      borderColor: palette.edgeMint,
      borderWidth: 1
    },
    spinnerColor: palette.white
  },

  buttonSecondaryUi4: {
    textStyle: {
      fontFamily: palette.QuicksandMedium,
      color: palette.black
    },
    gradientProps: {
      colors: [palette.darkMint, palette.edgeMint],
      end: { x: 1, y: 0 },
      start: { x: 0, y: 0 }
    },
    shadowParams: {
      shadowColor: palette.white,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 2
    },
    containerStyle: {
      borderColor: palette.edgeMint,
      borderWidth: 1
    },
    spinnerColor: palette.white
  },

  buttonTertiaryUi4: {
    textStyle: {
      fontFamily: palette.QuicksandMedium,
      color: palette.black
    },
    gradientProps: {
      colors: [palette.darkMint, palette.edgeMint],
      end: { x: 1, y: 0 },
      start: { x: 0, y: 0 }
    },
    shadowParams: {
      shadowColor: palette.white,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 2
    },
    containerStyle: {
      borderColor: palette.edgeMint,
      borderWidth: 1
    },
    spinnerColor: palette.white
  },

  cardBackgroundUi4: {
    colors: [palette.whiteOp10, palette.whiteOp10],
    end: { x: 1, y: 1 },
    start: { x: 0, y: 0 }
  },
  cardDisabledOverlayUi4: palette.blackOp65,
  cardRadiusRemUi4: 1,

  iconTappableAltUi4: palette.white,

  negativeTextMutedUi4: palette.gray,

  shadowColorUi4: palette.black,

  touchHighlightUi4: palette.lightGrayOp75
}
