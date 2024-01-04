import { Dimensions, Platform } from 'react-native'

import fioAddressLogo from '../../assets/images/details_fioAddress.png'
import edgeMark from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
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
  white: '#FFFFFF',
  black: '#000000',
  darkestNavy: '#06090c',

  darkMint: '#089e73',
  edgeMint: '#00f1a2',
  darkAqua: '#1b2f3b',
  navyAqua: '#121d25',
  navyAquaMiddle: '#11191f', // For vertical gradient
  navyAquaDarker: '#0E141A', // For vertical gradient
  blueGray: '#A4C7DF',
  gray: '#87939E',
  lightGray: '#D9E3ED',
  mutedBlue: '#2F5E89',
  accentGreen: '#77C513',
  accentRed: '#E85466',
  accentBlue: '#0073D9',
  accentOrange: '#F1AA19',
  darkBlueLightened: '#2B333A',

  blackOp25: 'rgba(0, 0, 0, .25)',
  blackOp50: 'rgba(0, 0, 0, .5)',

  whiteOp05: 'rgba(255, 255, 255, .05)',
  whiteOp10: 'rgba(255, 255, 255, .1)',
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
  skyBlue: '#3dd9f4',
  blackOp65: 'rgba(0, 0, 0, .65)',
  redOp60: 'rgba(232, 84, 102, .6)',
  grayOp70: 'rgba(135, 147, 158, .7)',
  greenOp60: 'rgba(119, 197, 19, .6)',
  lightGreen: '#75C649',
  lightRed: '#E84D65',

  learnLeft: 'rgba(0, 43, 51, .44)',
  learnMiddle: 'rgba(0, 81, 92, .44)',
  learnRight: 'rgba(0, 245, 155, .44)',

  // Button
  graySecondary: 'hsla(0, 0%, 100%, 0.20)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.514)',

  // Gradients
  warningOuter: '#772a0f',
  warningInner: '#835d22',
  errorOuter: '#94472e',
  errorInner: '#962c32',

  darkestGreen: '#20312f',
  darkGreen: '#00604d',

  orangeOp50: 'rgba(192, 93, 12, 0.5)',
  lightBlueOp50: 'rgba(10, 129, 153, 0.5)',
  purpleOp50: 'rgba(65, 35, 184, 0.5)',
  pinkOp50: 'rgba(219, 57, 159, 0.5)'
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
  iconTappable: palette.edgeMint,
  iconDeactivated: palette.whiteOp75,
  dangerIcon: palette.accentRed,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  transactionListIconBackground: palette.darkAqua,
  buySellCustomPluginModalIcon: palette.navyAqua,

  // Background
  // backgroundGradientColors: [palette.navyAqua, palette.navyAquaDarker], // For vertical gradient
  backgroundGradientColors: [palette.darkestNavy, palette.darkAqua],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 1, y: 0 },
  backgroundImageServerUrls: ['https://content.edge.app'],
  backgroundImage: undefined,
  backgroundLoadingOverlay: 'rgba(123,123,123,.2)',

  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0.3,

  // Modal
  modal: palette.navyAqua,
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,

  sideMenuColor: palette.navyAqua,
  sideMenuBorderColor: palette.navyAqua,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandMedium,

  // Tile
  // listHeaderBackground: palette.edgeNavy,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  // listSectionHeaderBackgroundGradientColors: [palette.navyAquaMiddle], // For vertical gradient
  listSectionHeaderBackgroundGradientColors: [palette.darkestNavy, palette.darkAqua],
  listSectionHeaderBackgroundGradientStart: { x: 0, y: 0 },
  listSectionHeaderBackgroundGradientEnd: { x: 1, y: 0 },

  // WalletList
  walletListBackground: palette.navyAqua,
  walletListMutedBackground: palette.navyAqua,

  // Text
  primaryText: palette.white,
  secondaryText: palette.skyBlue,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.gray,
  dangerText: palette.accentRed,
  textLink: palette.edgeMint,
  deactivatedText: palette.gray,
  emphasizedText: palette.edgeMint,
  // listHeaderText: palette.white,

  // Header
  headerIcon: edgeMark,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 1.5,
  addButtonFont: palette.QuicksandMedium,

  keypadButtonOutline: palette.transparent,
  keypadButtonOutlineWidth: 1,
  keypadButton: [palette.transparent, palette.transparent],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.edgeMint,
  keypadButtonTextShadow: textNoShadow,
  keypadButtonShadow: themeNoShadow,
  keypadButtonBorderRadiusRem: 0.25,
  keypadButtonFontSizeRem: 1.5,
  keypadButtonFont: palette.QuicksandMedium,

  primaryButtonOutline: palette.transparent,
  primaryButtonOutlineWidth: 0,
  primaryButton: [palette.darkestGreen, palette.darkGreen],
  primaryButtonColorStart: { x: 0, y: 0 },
  primaryButtonColorEnd: { x: 1, y: 0 },
  primaryButtonText: palette.white,
  primaryButtonTextShadow: textNoShadow,
  primaryButtonShadow: {
    shadowColor: palette.black,
    shadowOffset: { width: -1.5, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    /** @deprecated */
    elevation: 0
  },
  primaryButtonFontSizeRem: 1,
  primaryButtonFont: palette.QuicksandMedium,

  secondaryButtonOutline: palette.graySecondary,
  secondaryButtonOutlineWidth: 0,
  secondaryButton: [palette.graySecondary, palette.graySecondary],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.white,
  secondaryButtonTextShadow: textNoShadow,
  secondaryButtonShadow: {
    shadowColor: palette.black,
    shadowOffset: { width: -1.5, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    /** @deprecated */
    elevation: 0
  },
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

  pinUsernameButtonOutline: palette.transparent,
  pinUsernameButtonOutlineWidth: 0,
  pinUsernameButton: [palette.transparent, palette.transparent],
  pinUsernameButtonColorStart: { x: 0, y: 0 },
  pinUsernameButtonColorEnd: { x: 1, y: 1 },
  pinUsernameButtonText: palette.white,
  pinUsernameButtonTextShadow: textNoShadow,
  pinUsernameButtonShadow: themeNoShadow,
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
  cardBorderRadius: 16,
  cardTextShadow: {
    textShadowColor: palette.shadow,
    textShadowOffset: {
      width: 0,
      height: 0
    },
    textShadowRadius: 3
  },

  tabBarBackground: [palette.navyAqua, palette.navyAqua],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
  tabBarTopOutlineColors: [palette.navyAqua, palette.navyAqua],
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
  confirmationSlider: palette.darkBlueLightened,
  confirmationSliderText: palette.white,
  confirmationSliderArrow: palette.darkAqua,
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
  settingsRowHeaderBackground: [palette.navyAqua, palette.navyAqua],
  settingsRowHeaderBackgroundStart: { x: 0, y: 0 },
  settingsRowHeaderBackgroundEnd: { x: 1, y: 1 },
  settingsRowHeaderFont: palette.QuicksandMedium,
  settingsRowHeaderFontSizeRem: 1,
  settingsRowSubHeader: palette.transparent,

  // Native iOS date modal:
  dateModalTextLight: palette.accentBlue,
  dateModalTextDark: palette.white,
  dateModalBackgroundLight: palette.white,
  dateModalBackgroundDark: palette.darkAqua,

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
  outlineTextInputColor: palette.transparent,
  outlineTextInputTextColor: palette.white,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.blueGray,
  outlineTextInputBorderColorDisabled: palette.gray,
  outlineTextInputBorderColorFocused: palette.edgeMint,
  outlineTextInputLabelColor: palette.blueGray,
  outlineTextInputLabelColorDisabled: palette.gray,
  outlineTextInputLabelColorFocused: palette.edgeMint,

  // Simple Text Input
  textInputTextColor: palette.white,
  textInputTextColorDisabled: palette.gray,
  textInputTextColorFocused: palette.white,
  textInputBackgroundColor: palette.darkAqua,
  textInputBackgroundColorDisabled: palette.darkAqua,
  textInputBackgroundColorFocused: palette.darkAqua,
  textInputBorderColor: `${palette.edgeMint}00`,
  textInputBorderColorDisabled: palette.gray,
  textInputBorderColorFocused: palette.edgeMint,
  textInputBorderRadius: 100,
  textInputBorderWidth: 1,
  textInputIconColor: palette.gray,
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

  primaryLogo: edgeLogo,
  fioAddressLogo: fioAddressLogo,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoMoonpay: guiPluginLogoMoonpay,

  // UI 4.0:
  // Shadows
  iconShadow: {
    shadowColor: palette.black,
    shadowOffset: {
      width: -3,
      height: 3
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 0
  },

  // Basic Card Styles
  cardBaseColorUi4: palette.whiteOp10,
  cardGradientWarningUi4: {
    colors: [palette.warningOuter, palette.warningInner, palette.warningInner, palette.warningOuter],
    end: { x: 0.9, y: 0 },
    start: { x: 0, y: 0.9 }
  },
  cardGradientErrorUi4: {
    colors: [palette.errorOuter, palette.errorInner, palette.errorInner, palette.errorOuter],
    end: { x: 0.9, y: 0 },
    start: { x: 0, y: 0.9 }
  },
  cardGradientLearnUi4: {
    colors: [palette.learnRight, palette.learnMiddle, palette.learnLeft],
    end: { x: 1, y: 0 },
    start: { x: 0, y: 1 }
  },
  cardOverlayDisabledUi4: palette.blackOp65,

  // Special Home Scene Tiled Cards
  buyCardGradientUi4: {
    colors: [palette.orangeOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  sellCardGradientUi4: {
    colors: [palette.lightBlueOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  fioCardGradientUi4: {
    colors: [palette.purpleOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  swapCardGradientUi4: {
    colors: [palette.pinkOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },

  txDirBgReceiveUi4: palette.greenOp60,
  txDirBgSendUi4: palette.redOp60,
  txDirBgSwapUi4: palette.grayOp70,
  txDirFgReceiveUi4: palette.lightGreen,
  txDirFgSendUi4: palette.lightRed,
  txDirFgSwapUi4: palette.lightGray
}
