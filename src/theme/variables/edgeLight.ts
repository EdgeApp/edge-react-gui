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
import paymentTypeLogoPaypal from '../../assets/images/paymentTypes/paymentTypeLogoPaypal.png'
import paymentTypeLogoPix from '../../assets/images/paymentTypes/paymentTypeLogoPix.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoRevolut from '../../assets/images/paymentTypes/paymentTypeLogoRevolut-light.png'
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
  skyBlue: '#3dd9f4',
  blackOp65: 'rgba(0, 0, 0, .65)',
  redOp60: 'rgba(232, 84, 102, .6)',
  grayOp70: 'rgba(135, 147, 158, .7)',
  greenOp60: 'rgba(119, 197, 19, .6)',
  lightGreen: '#75C649',
  greenOp50: 'rgba(51, 183, 36, 0.5)',
  lightRed: '#E84D65',

  learnLeft: 'rgba(0, 43, 51, .44)',
  learnMiddle: 'rgba(0, 81, 92, .44)',
  learnRight: 'rgba(0, 245, 155, .44)',

  // Background
  backgroundGreen: '#15cb7f',
  backgroundPurple: '#7f15cb',

  // Button
  graySecondary: 'hsla(0, 0%, 100%, 0.20)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.514)',

  // Gradients
  warningOuter: 'rgba(119, 43, 15, 0.44)',
  warningInner: 'rgba(130, 91, 33, 0.44)',
  errorOuter: 'rgba(148, 71, 46, 0.44)',
  errorInner: 'rgba(150, 44, 49, 0.44)',

  darkestGreen: '#20312f',
  darkGreen: '#00604d',

  orangeOp24: '#fc9e733d',
  lightBlueOp24: '#4ea5bc3d',
  purpleOp24: '#4123b73d',
  pinkOp24: '#db37a03d'
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
  loadingIcon: palette.edgeBlue,

  // Background
  backgroundGradientColors: [palette.lightestGray, palette.lightestGray],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 1, y: 0 },
  backgroundDots: {
    blurRadius: scale(80),
    dotOpacity: 0.3,
    dots: [
      { color: palette.backgroundGreen, cx: '75%', cy: '25%', r: scale(175) },
      { color: palette.backgroundPurple, cx: '25%', cy: '75%', r: scale(150) }
    ],
    assetOverrideDots: [undefined, { accentColor: 'iconAccentColor' }, null]
  },
  assetBackgroundGradientColors: [palette.lightestGray, palette.lightestGray],
  assetBackgroundGradientStart: { x: 0, y: 0 },
  assetBackgroundGradientEnd: { x: 0, y: 1 },
  assetBackgroundColorScale: 0.3,

  // Camera Overlay
  cameraOverlayColor: palette.gray,
  cameraOverlayOpStart: 1,
  cameraOverlayOpEnd: 0.4,

  // Modal
  modal: palette.lightestGray,
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,
  modalBackground: palette.blackOp25,
  modalSceneOverlayColor: palette.black,
  modalDragbarColor: palette.gray,

  modalLikeBackground: '#333232',

  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandMedium,

  // Tile
  // listHeaderBackground: palette.white,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [palette.transparent],
  listSectionHeaderBackgroundGradientStart: { x: 0, y: 0 },
  listSectionHeaderBackgroundGradientEnd: { x: 1, y: 0 },

  // Text
  primaryText: palette.black,
  secondaryText: palette.gray,
  warningText: palette.accentOrange,
  positiveText: palette.gray,
  negativeText: palette.accentRed,
  negativeDeltaText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.edgeBlue,
  deactivatedText: palette.gray,
  emphasizedText: palette.edgeMint,

  // Header
  headerIcon: edgeMark,
  headerBackground: [palette.white, palette.white],
  headerBackgroundStart: { x: 0, y: 0 },
  headerBackgroundEnd: { x: 1, y: 1 },
  headerOutlineColors: [palette.white, palette.white],

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

  // Card
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

  toggleButton: palette.accentGreen,
  toggleButtonOff: palette.gray,

  // Confirmation slider
  confirmationSlider: palette.blackOp10,
  confirmationSliderCompleted: palette.darkGreen,
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
  thinLineWidth: 1,
  mediumLineWidth: 2,
  thickLineWidth: 3,

  // DividerLine component
  dividerLineHeight: 1,
  dividerLineColors: [palette.edgeBlue, palette.edgeBlue],

  // Settings Row
  settingsRowBackground: palette.white,
  settingsRowPressed: palette.transparent,
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
  searchListRefreshControlIndicator: palette.transparent,
  clipboardPopupText: palette.black,

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

  // Simple Text Input
  textInputTextColor: palette.gray,
  textInputTextColorDisabled: palette.white,
  textInputTextColorFocused: palette.white,
  textInputBackgroundColor: palette.edgeNavy,
  textInputBackgroundColorDisabled: palette.edgeNavy,
  textInputBackgroundColorFocused: palette.edgeNavy,
  textInputBorderColor: palette.transparent,
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
  paymentTypeLogoPaypal,
  paymentTypeLogoPix,
  paymentTypeLogoPoli,
  paymentTypeLogoRevolut,
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

  notifcationCardShadow: {
    shadowColor: palette.black,
    shadowOffset: {
      width: 3,
      height: 3
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    // Disable Android shadow
    elevation: 0
  },

  dropdownListShadow: {
    shadowColor: 'white',
    shadowOffset: {
      width: 10,
      height: 10
    },
    shadowOpacity: 0.3,
    shadowRadius: 64,
    // Disable Android shadow
    elevation: 0
  },

  // Basic Card Styles
  cardBaseColor: palette.whiteOp10,
  cardGradientWarning: {
    colors: [palette.warningOuter, palette.warningInner, palette.warningInner, palette.warningOuter],
    end: { x: 0.9, y: 0 },
    start: { x: 0, y: 0.9 }
  },
  cardGradientError: {
    colors: [palette.errorOuter, palette.errorInner, palette.errorInner, palette.errorOuter],
    end: { x: 0.9, y: 0 },
    start: { x: 0, y: 0.9 }
  },
  cardGradientLearn: {
    colors: [palette.learnRight, palette.learnMiddle, palette.learnLeft],
    end: { x: 1, y: 0 },
    start: { x: 0, y: 1 }
  },
  cardOverlayDisabled: palette.blackOp65,

  // Special Home Scene Tiled Cards
  buyCardGradient: {
    colors: [palette.orangeOp24, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  sellCardGradient: {
    colors: [palette.lightBlueOp24, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  swapCardGradient: {
    colors: [palette.pinkOp24, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  earnCardGradient: {
    colors: [palette.greenOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  txDirBgReceive: palette.greenOp60,
  txDirBgSend: palette.redOp60,
  txDirBgSwap: palette.grayOp70,
  txDirFgReceive: palette.lightGreen,
  txDirFgSend: palette.lightRed,
  txDirFgSwap: palette.lightGray
}
