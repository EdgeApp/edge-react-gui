import { Dimensions, Platform } from 'react-native'

import fioAddressLogo from '../../assets/images/details_fioAddress.png'
import edgeMark from '../../assets/images/edgeLogo/Edge_logo_Icon-light.png'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L-light.png'
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
import paymentTypeLogoPaypal from '../../assets/images/paymentTypes/paymentTypeLogoPaypal.png'
import paymentTypeLogoPix from '../../assets/images/paymentTypes/paymentTypeLogoPix.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoRevolut from '../../assets/images/paymentTypes/paymentTypeLogoRevolut-dark.png'
import paymentTypeLogoSofort from '../../assets/images/paymentTypes/paymentTypeLogoSofort.png'
import paymentTypeLogoUpi from '../../assets/images/paymentTypes/paymentTypeLogoUpi.png'
import paymentTypeLogoVenmo from '../../assets/images/paymentTypes/paymentTypeLogoVenmo.png'
import paymentTypeVisa from '../../assets/images/paymentTypes/paymentTypeVisa.png'
import walletListSlidingTutorial from '../../assets/images/tutorials/walletList_sliding_dark.gif'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { textNoShadow, type Theme, themeNoShadow } from '../../types/Theme'
import { scale } from '../../util/scaling'

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  blackTransparent: '#00000000',
  darkestNavy: '#06090c',

  darkMint: '#089e73',
  edgeMint: '#00f1a2',

  gray: '#888888',
  darkGray: '#494949',
  darkGrayOp30: 'hsla(0, 0%, 53%, 0.3)',
  lightGray: '#e2e2e2',

  blueGray: '#D9E3ED',
  blueGrayOp75: 'rgba(217, 227, 237, .75)',
  blueGrayOp80: 'rgba(135, 147, 158, .8)',

  accentGreen: '#77C513',
  accentRed: '#ec695b',
  accentBlue: '#0073D9',
  accentOrange: '#c98923',
  darkBlueLightened: '#2B333A',

  blackOp10: 'rgba(0, 0, 0, .1)',
  blackOp35: 'rgba(0, 0, 0, .25)',
  blackOp50: 'rgba(0, 0, 0, .5)',
  blackOp70: 'rgba(0, 0, 0, .7)',
  blackOp80: 'rgba(0, 0, 0, .8)',

  whiteOp05: 'rgba(255, 255, 255, .05)',
  whiteOp10: 'rgba(255, 255, 255, .1)',
  whiteOp25: 'rgba(255, 255, 255, .25)',
  whiteOp37: 'rgba(255, 255, 255, .37)',
  whiteOp50: 'rgba(255, 255, 255, .5)',
  whiteOp75: 'rgba(255, 255, 255, .75)',

  accentOrangeOp30: 'rgba(241, 170, 25, .3)',
  transparent: 'rgba(255, 255, 255, 0)',

  // Fonts
  SFUITextRegular: 'SF-UI-Text-Regular',
  QuicksandLight: 'Quicksand-Light',
  QuicksandRegular: 'Quicksand-Regular',
  QuicksandMedium: 'Quicksand-Medium',
  QuicksandSemiBold: 'Quicksand-SemiBold',
  QuicksandBold: 'Quicksand-Bold',

  // UI4 palette
  skyBlue: '#4a8e8c',
  blackOp65: 'rgba(0, 0, 0, .65)',
  redOp60: 'rgba(232, 84, 102, .6)',
  blueGrayOp70: 'rgba(135, 147, 158, .7)',
  greenOp60: 'rgba(119, 197, 19, .6)',
  lightGreen: '#75C649',
  greenOp50: 'rgba(56, 106, 50, 0.17)',
  lightRed: '#E84D65',
  ash: '#D7D7D7',

  learnLeft: 'rgba(0, 43, 51, .44)',
  learnMiddle: 'rgba(0, 81, 92, .44)',
  learnRight: 'rgba(0, 245, 155, .44)',

  // Background:
  backgroundWhite: '#f1f0f0',
  backgroundGreen: '#00e084',
  backgroundYellow: '#fcb329',

  // Button
  graySecondary: 'hsla(0, 0%, 100%, 0.20)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.514)',

  // Gradients
  warningOuter: 'rgba(119, 43, 15, 0.44)',
  warningInner: 'rgba(130, 91, 33, 0.44)',
  errorOuter: 'rgba(148, 71, 46, 0.44)',
  errorInner: 'rgba(150, 44, 49, 0.44)',

  darkestGreen: '#5c9067ec',
  darkGreen: '#77bb81ef',

  backgroundLightGreen: '#f6f6fb',
  cardLightGreen: '#e3eeef',
  tealBlueOp90: '#e3eeefe0',
  skyBlueOp10: '#4a8e8c27',
  peachOp90: '#eda96ef3',
  darkGreenOp25: '#5c9067f8',
  lightGreenOp25: '#77bb81f8',

  giftCardOverlayDark: 'rgba(0, 0, 0, .8)',
  giftCardOverlayLight: 'rgba(0, 0, 0, .5)'
}

const deviceWidth = Dimensions.get('window').width

export const edgeLight: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: false,
  preferPrimaryButton: true,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.darkestNavy,
  iconTappable: palette.darkMint,
  iconDeactivated: palette.whiteOp75,
  dangerIcon: palette.accentRed,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  loadingIcon: palette.darkMint,

  // Background
  backgroundGradientColors: [
    palette.backgroundLightGreen,
    palette.backgroundLightGreen
  ],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 1, y: 1 },
  backgroundDots: {
    blurRadius: scale(80),
    dotOpacity: 0.1,
    dots: [
      {
        // Top-left:
        color: palette.transparent,
        cx: '10%',
        cy: '10%',
        r: scale(80)
      },
      {
        // Mid-right:
        color: palette.transparent,
        cx: '95%',
        cy: '30%',
        r: scale(90)
      },
      {
        // Bottom-left:
        color: palette.transparent,
        cx: '-15%',
        cy: '100%',
        r: scale(220)
      }
    ],
    assetOverrideDots: [undefined, { accentColor: 'iconAccentColor' }, null]
  },
  assetBackgroundGradientColors: [
    palette.backgroundWhite,
    palette.backgroundWhite
  ],
  assetBackgroundGradientStart: { x: 0, y: 0 },
  assetBackgroundGradientEnd: { x: 0, y: 1 },
  assetBackgroundColorScale: 0,

  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0.3,

  // Modal
  modal: palette.cardLightGreen,
  modalCloseIcon: palette.darkMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,
  modalBackground: palette.backgroundWhite,
  modalSceneOverlayColor: palette.blackOp50,
  modalDragbarColor: palette.darkGrayOp30,

  modalLikeBackground: palette.cardLightGreen,

  sideMenuBorderColor: palette.backgroundWhite,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandMedium,

  // Tile
  // listHeaderBackground: palette.edgeNavy,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [`#000000aa`, `#00000000`],
  // Commenting out will remove background gradient:
  listSectionHeaderBackgroundGradientStart: null,
  listSectionHeaderBackgroundGradientEnd: null,

  // Text
  primaryText: palette.darkestNavy,
  secondaryText: palette.skyBlue,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.blueGray,
  negativeDeltaText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.darkMint,
  deactivatedText: palette.darkGray,
  emphasizedText: palette.darkMint,
  assetFallbackText: palette.ash,

  // Header
  headerIcon: edgeMark,
  headerBackground: [palette.white, palette.transparent],
  headerBackgroundStart: { x: 0, y: 0 },
  headerBackgroundEnd: { x: 0, y: 0.5 },
  headerOutlineColors: [palette.transparent, palette.transparent],

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 1.5,
  addButtonFont: palette.QuicksandMedium,

  keypadButtonOutline: palette.transparent,
  keypadButtonOutlineWidth: 1,
  keypadButton: [palette.transparent, palette.transparent],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.darkMint,
  keypadButtonTextShadow: textNoShadow,
  keypadButtonShadow: themeNoShadow,
  keypadButtonBorderRadiusRem: 0.25,
  keypadButtonFontSizeRem: 1.5,
  keypadButtonFont: palette.QuicksandMedium,

  primaryButtonOutline: palette.transparent,
  primaryButtonOutlineWidth: 0,
  primaryButton: [palette.darkestGreen, palette.darkGreen],
  primaryButtonColorStart: { x: 0, y: 1 },
  primaryButtonColorEnd: { x: 0, y: 0 },
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

  secondaryButtonOutline: palette.skyBlueOp10,
  secondaryButtonOutlineWidth: 0,
  secondaryButton: [palette.skyBlueOp10, palette.skyBlueOp10],
  secondaryButtonDisabled: [palette.blueGrayOp70, palette.blueGrayOp70],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.darkestNavy,
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
  escapeButtonText: palette.darkMint,
  escapeButtonTextShadow: textNoShadow,
  escapeButtonShadow: themeNoShadow,
  escapeButtonFontSizeRem: 1,
  escapeButtonFont: palette.QuicksandRegular,

  pinUsernameButtonOutline: palette.transparent,
  pinUsernameButtonOutlineWidth: 0,
  pinUsernameButton: [palette.transparent, palette.transparent],
  pinUsernameButtonColorStart: { x: 0, y: 0 },
  pinUsernameButtonColorEnd: { x: 1, y: 1 },
  pinUsernameButtonText: palette.darkestNavy,
  pinUsernameButtonTextShadow: textNoShadow,
  pinUsernameButtonShadow: themeNoShadow,
  pinUsernameButtonBorderRadiusRem: 1,
  pinUsernameButtonFontSizeRem: 1.5,
  pinUsernameButtonFont: palette.QuicksandRegular,

  // Dropdown colors:
  dropdownWarning: palette.accentOrange,
  dropdownError: palette.accentRed,
  dropdownText: palette.darkestNavy,

  // Card
  cardBorder: 1,
  cardBorderColor: palette.whiteOp10,
  cardBorderRadius: 16,
  cardTextShadow: {
    textShadowColor: palette.transparent,
    textShadowOffset: {
      width: 0,
      height: 0
    },
    textShadowRadius: 3
  },
  // Mimics raised/embossed text on physical credit cards
  embossedTextShadow: {
    textShadowColor: palette.blackOp80,
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textShadowRadius: 3
  },
  tabBarBackground: [palette.transparent, palette.transparent],
  tabBarBackgroundStart: { x: 0, y: 0.5 },
  tabBarBackgroundEnd: { x: 0, y: 1 },
  tabBarTopOutlineColors: [`${palette.white}22`, `${palette.white}22`],
  tabBarIcon: palette.darkestNavy,
  tabBarIconHighlighted: palette.darkMint,

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

  shimmerBackgroundColor: palette.whiteOp05,
  shimmerBackgroundHighlight: palette.whiteOp10,

  toggleButton: palette.darkMint,
  toggleButtonOff: palette.darkGray,

  // Confirmation slider
  confirmationSlider: palette.darkGray,
  confirmationSliderCompleted: palette.darkGreen,
  confirmationSliderText: palette.darkestNavy,
  confirmationSliderArrow: palette.backgroundWhite,
  confirmationSliderThumb: palette.darkMint,
  confirmationSliderTextDeactivated: palette.darkGray,
  confirmationThumbDeactivated: palette.darkGray,
  confirmationSliderWidth: deviceWidth >= 340 ? 295 : deviceWidth - 45,
  confirmationSliderThumbWidth: 55,

  // Lines
  lineDivider: palette.blackOp10,
  titleLineDivider: palette.blackOp10,
  thinLineWidth: 1,
  mediumLineWidth: 2,
  thickLineWidth: 3,

  // DividerLine component
  dividerLineHeight: 1,
  dividerLineColors: [palette.blackOp10, palette.blackOp10],

  // Settings Row
  settingsRowBackground: palette.transparent,
  settingsRowHeaderFont: palette.QuicksandMedium,
  settingsRowHeaderFontSizeRem: 1,
  settingsRowSubHeader: palette.transparent,

  // Native iOS date modal:
  dateModalTextLight: palette.accentBlue,
  dateModalTextDark: palette.white,
  dateModalBackgroundLight: palette.white,
  dateModalBackgroundDark: palette.backgroundWhite,

  // Wallet Icon Progress
  walletProgressIconFill: palette.darkMint,
  walletProgressIconDone: palette.white,

  // Misc
  searchListRefreshControlIndicator: palette.transparent,
  clipboardPopupText: palette.black,

  // Toasts
  toastBackground: palette.blueGray,
  toastText: palette.black,

  // Fonts
  fontFaceDefault: palette.QuicksandRegular,
  fontFaceMedium: palette.QuicksandMedium,
  fontFaceBold: palette.QuicksandBold,
  fontFaceSymbols:
    Platform.OS === 'android'
      ? palette.SFUITextRegular
      : palette.QuicksandRegular,

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
  textInputTextColor: palette.darkestNavy,
  textInputTextColorDisabled: palette.darkGray,
  textInputTextColorFocused: palette.darkestNavy,
  textInputBackgroundColor: palette.backgroundWhite,
  textInputBackgroundColorDisabled: palette.backgroundWhite,
  textInputBackgroundColorFocused: palette.backgroundWhite,
  textInputBorderColor: `${palette.darkMint}00`,
  textInputBorderColorDisabled: palette.backgroundWhite,
  textInputBorderColorFocused: palette.darkMint,
  textInputBorderRadius: 100,
  textInputBorderWidth: 1,
  textInputIconColor: palette.darkGray,
  textInputIconColorDisabled: palette.darkGray,
  textInputIconColorFocused: palette.darkMint,
  textInputPlaceholderColor: palette.darkGray,
  textInputPlaceholderColorDisabled: palette.darkGray,
  textInputPlaceholderColorFocused: palette.darkGray,
  textInputSelectionColor: palette.darkGray,

  // Animation
  fadeDisable: palette.darkGray,

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
  paymentTypeLogoVenmo,
  paymentTypeVisa,

  primaryLogo: edgeLogo,
  fioAddressLogo,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoMoonpay,

  // UI 4.0:

  badgeDot: palette.accentRed,

  // Shadows
  iconShadow: {
    shadowColor: palette.transparent,
    shadowOffset: {
      width: -3,
      height: 3
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    // Disable Android shadow
    elevation: 0
  },

  notificationCardShadow: {
    shadowColor: palette.black,
    shadowOffset: {
      width: 2,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    // Disable Android shadow
    elevation: 0
  },

  dropdownListShadow: {
    shadowColor: 'black',
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
  cardBaseColor: palette.cardLightGreen,
  cardGradientWarning: {
    colors: [
      palette.warningOuter,
      palette.warningInner,
      palette.warningInner,
      palette.warningOuter
    ],
    end: { x: 0.9, y: 0 },
    start: { x: 0, y: 0.9 }
  },
  cardGradientError: {
    colors: [
      palette.errorOuter,
      palette.errorInner,
      palette.errorInner,
      palette.errorOuter
    ],
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
    colors: [palette.tealBlueOp90, palette.tealBlueOp90],
    end: { x: 1, y: 1 },
    start: { x: 0, y: 0 }
  },
  sellCardGradient: {
    colors: [palette.tealBlueOp90, palette.tealBlueOp90],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  earnCardGradient: {
    colors: [palette.tealBlueOp90, palette.tealBlueOp90],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  swapCardGradient: {
    colors: [palette.tealBlueOp90, palette.tealBlueOp90],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  spendCardGradient: {
    colors: [palette.tealBlueOp90, palette.tealBlueOp90],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },

  txDirBgReceive: palette.greenOp60,
  txDirBgSend: palette.redOp60,
  txDirBgSwap: palette.blueGrayOp70,
  txDirFgReceive: palette.lightGreen,
  txDirFgSend: palette.lightRed,
  txDirFgSwap: palette.blueGray,

  giftCardOverlayGradient: {
    colors: [
      palette.giftCardOverlayDark,
      palette.giftCardOverlayLight,
      palette.giftCardOverlayDark
    ],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 }
  },
  giftCardText: palette.white
}
