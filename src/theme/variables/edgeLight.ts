import { Dimensions, Platform } from 'react-native'

import edgeMark from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import guiPluginLogoMoonpay from '../../assets/images/guiPlugins/guiPluginLogoMoonpayDark.png'
import fioAddressLogo from '../../assets/images/list_fioAddress.png'
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
import walletListSlidingTutorial from '../../assets/images/tutorials/walletList_sliding_light.gif'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { textNoShadow, Theme, themeNoShadow } from '../../types/Theme'
import { scale } from '../../util/scaling'

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
  whiteOp05: 'rgba(255, 255, 255, 0.05)',
  whiteOp10: 'rgba(255, 255, 255, 0.1)',
  whiteOp75: 'rgba(255, 255, 255, .75)',
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
  blackOp65: 'rgba(0, 0, 0, .65)',

  // UI4 palette
  redOp60: 'rgba(232, 84, 102, .6)',
  grayOp70: 'rgba(135, 147, 158, .7)',
  greenOp60: 'rgba(119, 197, 19, .6)',
  lightGreen: '#75C649',
  lightRed: '#E84D65'
}

const deviceWidth = Dimensions.get('window').width

export const edgeLight: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: false,
  preferPrimaryButton: false,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.black,
  iconTappable: palette.edgeBlue,
  iconDeactivated: palette.whiteOp75,
  dangerIcon: palette.accentRed,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  transactionListIconBackground: palette.white,
  buySellCustomPluginModalIcon: palette.white,

  // Background
  backgroundGradientColors: [palette.lightestGray, palette.lightestGray],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 0, y: 1 },
  backgroundImageServerUrls: ['https://content.edge.app'],
  backgroundImage: undefined,
  backgroundLoadingOverlay: `rgba(123,123,123,.2)`,

  // Camera Overlay
  cameraOverlayColor: palette.gray,
  cameraOverlayOpStart: 1,
  cameraOverlayOpEnd: 0.4,

  // Modal
  modal: palette.lightestGray,
  // @ts-expect-error
  modalBlurType: 'dark',
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,

  sideMenuColor: palette.lightestGray,
  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandMedium,

  // Tile
  // listHeaderBackground: palette.white,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [palette.transparent],

  // WalletList
  walletListBackground: palette.edgeBlue,
  walletListMutedBackground: palette.mutedBlue,

  // Text
  primaryText: palette.black,
  secondaryText: palette.gray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeBlue,
  deactivatedText: palette.gray,
  // listHeaderText: palette.black,

  // Header
  headerIcon: edgeMark,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 0.25,
  addButtonFont: palette.QuicksandMedium,

  keypadButtonOutline: palette.edgeBlue,
  keypadButtonOutlineWidth: 1,
  keypadButton: [palette.transparent, palette.transparent],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.edgeBlue,
  keypadButtonTextShadow: textNoShadow,
  keypadButtonShadow: themeNoShadow,
  keypadButtonBorderRadiusRem: 0.25,
  keypadButtonFontSizeRem: 1,
  keypadButtonFont: palette.QuicksandMedium,

  primaryButtonOutline: palette.transparent,
  primaryButtonOutlineWidth: 1,
  primaryButton: [palette.edgeBlue, palette.edgeBlue],
  primaryButtonColorStart: { x: 0, y: 0 },
  primaryButtonColorEnd: { x: 1, y: 1 },
  primaryButtonText: palette.edgeBlue,
  primaryButtonTextShadow: textNoShadow,
  primaryButtonShadow: themeNoShadow,
  primaryButtonFontSizeRem: 1,
  primaryButtonFont: palette.QuicksandRegular,

  secondaryButtonOutline: palette.edgeBlue,
  secondaryButtonOutlineWidth: 1,
  secondaryButton: [palette.transparent, palette.transparent],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.edgeBlue,
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

  pinUsernameButtonOutline: palette.transparent,
  pinUsernameButtonOutlineWidth: 0,
  pinUsernameButton: [palette.transparent, palette.transparent],
  pinUsernameButtonColorStart: { x: 0, y: 0 },
  pinUsernameButtonColorEnd: { x: 1, y: 1 },
  pinUsernameButtonText: palette.edgeBlue,
  pinUsernameButtonTextShadow: textNoShadow,
  pinUsernameButtonShadow: themeNoShadow,
  pinUsernameButtonBorderRadiusRem: 1,
  pinUsernameButtonFontSizeRem: 1.5,
  pinUsernameButtonFont: palette.QuicksandMedium,

  // Dropdown colors:
  dropdownWarning: palette.accentOrange,
  dropdownError: palette.accentRed,
  dropdownText: palette.white,

  // tertiaryButtonOutline: palette.edgeBlue,
  // tertiaryButton: palette.transparent,
  // tertiaryButtonText: palette.edgeBlue,

  // glassButton: palette.blackOp10,
  // glassButtonDark: palette.blackOp50,
  // glassButtonDarkIcon: palette.white,
  // glassButtonIcon: palette.edgeBlue,

  // dangerButtonOutline: palette.transparent,
  // dangerButton: palette.accentRed,
  // dangerButtonText: palette.white,

  // Card
  // cardBackground: palette.white,
  // cardShadow: palette.blackOp25,
  cardBorder: 1,
  cardBorderColor: palette.whiteOp10,
  cardBorderRadius: 4,

  tabBarBackground: [palette.white, palette.white],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
  tabBarTopOutlineColors: [palette.white, palette.white],
  tabBarIcon: palette.gray,
  tabBarIconHighlighted: palette.edgeBlue,

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

  shimmerBackgroundColor: palette.whiteOp05,
  shimmerBackgroundHighlight: palette.whiteOp10,

  // pinOutline: palette.edgeBlue,
  // pinFilled: palette.edgeBlue,

  // radioButtonOutline: palette.edgeNavy,
  // radioButtonFilled: palette.edgeBlue,

  toggleButton: palette.accentGreen,
  toggleButtonOff: palette.gray,
  // toggleButtonThumb: palette.white,

  // warningBubble: palette.accentOrange,

  // Confirmation slider
  confirmationSlider: palette.blackOp10,
  confirmationSliderText: palette.edgeBlue,
  confirmationSliderArrow: palette.white,
  confirmationSliderThumb: palette.edgeBlue,
  confirmationSliderTextDeactivated: palette.gray,
  confirmationThumbDeactivated: palette.gray,
  confirmationSliderWidth: deviceWidth >= 340 ? 295 : deviceWidth - 45,
  confirmationSliderThumbWidth: 55,

  // Lines
  lineDivider: palette.edgeBlue,
  titleLineDivider: palette.edgeBlue,
  // textInputLine: palette.gray,
  // orLine: palette.gray,
  // tileDivider: palette.gray,
  thinLineWidth: 1,
  mediumLineWidth: 2,
  thickLineWidth: 3,

  // DividerLine component
  dividerLineHeight: 1,
  dividerLineColors: [palette.edgeBlue, palette.edgeBlue],

  // Notifications
  // notificationBackground: palette.grayOp80,
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
  settingsRowBackground: palette.white,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderBackground: [palette.lightGray, palette.lightGray],
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
  flipInputBorder: palette.edgeBlue,

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
  outlineTextInputTextColor: palette.black,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.gray,
  outlineTextInputBorderColorDisabled: palette.gray,
  outlineTextInputBorderColorFocused: palette.edgeBlue,
  outlineTextInputLabelColor: palette.gray,
  outlineTextInputLabelColorDisabled: palette.gray,
  outlineTextInputLabelColorFocused: palette.edgeBlue,

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
  textInputBorderRadius: 100,
  textInputBorderWidth: 1,
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

  primaryLogo: edgeLogo,
  fioAddressLogo: fioAddressLogo,
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
      colors: [palette.edgeMint, palette.edgeMint],
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
      colors: [palette.edgeMint, palette.edgeMint],
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
      colors: [palette.edgeMint, palette.edgeMint],
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
    colors: [palette.lightGrayOp75, palette.lightGrayOp75],
    end: { x: 1, y: 1 },
    start: { x: 0, y: 0 }
  },
  cardDisabledOverlayUi4: palette.blackOp65,
  cardRadiusRemUi4: 1,

  iconTappableAltUi4: palette.black,

  negativeTextMutedUi4: palette.gray,

  shadowColorUi4: palette.gray,

  touchHighlightUi4: palette.lightGrayOp75,

  txDirBgReceiveUi4: palette.greenOp60,
  txDirBgSendUi4: palette.redOp60,
  txDirBgSwapUi4: palette.grayOp70,
  txDirFgReceiveUi4: palette.lightGreen,
  txDirFgSendUi4: palette.lightRed,
  txDirFgSwapUi4: palette.lightGray
}
