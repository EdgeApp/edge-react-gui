import { Dimensions, Platform } from 'react-native'

import coinhubLogo from '../../assets/images/coinhubLogo/Coin_logo_L.png'
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
import paymentTypeLogoPaypal from '../../assets/images/paymentTypes/paymentTypeLogoPaypal.png'
import paymentTypeLogoPix from '../../assets/images/paymentTypes/paymentTypeLogoPix.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoRevolut from '../../assets/images/paymentTypes/paymentTypeLogoRevolut-dark.png'
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
  coinhubBlue: '#26a9e1',
  coinhubNavy: '#1c385d',
  coinhubNavyOp50: '#1c385d80',
  coinhubOrange: '#e27226',
  coinhubOrangeOp25: '#e2722640',
  darkBlue: '#1e476e',
  darkerBlue: '#19294c',
  darkBlueOp50: '#1e476e80',
  darkerBlueOp50: '#19294c80',
  darkOrange: '#211D1A',

  // Button
  graySecondary: 'hsla(0, 0%, 100%, 0.20)',

  blueGray: '#A5D4FF',
  gray: '#87939E',
  darkGreen: '#00604d',
  darkGray: '#333232',
  darkGrayOp30: 'hsla(0, 0%, 53%, 0.3)',
  lightGray: '#D9E3ED',
  mutedBlue: '#2F5E89',
  accentGreen: '#77C513',
  accentRed: '#E85466',
  accentBlue: '#0073D9',
  accentOrange: '#F1AA19',

  blackOp10: 'rgba(0, 0, 0, .1)',
  blackOp25: 'rgba(0, 0, 0, .25)',
  blackOp35: 'rgba(0, 0, 0, .25)',
  blackOp50: 'rgba(0, 0, 0, .5)',
  blackOp65: 'rgba(0, 0, 0, .65)',
  blackOp70: 'rgba(0, 0, 0, .7)',

  whiteOp05: 'rgba(255, 255, 255, .05)',
  whiteOp10: 'rgba(255, 255, 255, .1)',
  whiteOp37: 'rgba(255, 255, 255, .37)',
  whiteOp50: 'rgba(255, 255, 255, .5)',
  whiteOp75: 'rgba(255, 255, 255, .75)',

  grayOp80: 'rgba(135, 147, 158, .8)',
  accentOrangeOp30: 'rgba(241, 170, 25, .3)',
  lightGrayOp75: 'rgba(217, 227, 237, .75)',
  transparent: 'rgba(255, 255, 255, 0)',

  redOp60: 'rgba(232, 84, 102, .6)',
  blueGrayOp70: 'rgba(135, 147, 158, .7)',
  greenOp60: 'rgba(119, 197, 19, .6)',
  lightGreen: '#75C649',
  lightRed: '#E84D65',
  greenOp50: 'rgba(51, 183, 36, 0.5)',

  // Gradients
  warningOuter: 'rgba(119, 43, 15, 0.44)',
  warningInner: 'rgba(130, 91, 33, 0.44)',
  errorOuter: 'rgba(148, 71, 46, 0.44)',
  errorInner: 'rgba(150, 44, 49, 0.44)',

  orangeOp50: 'rgba(192, 93, 12, 0.5)',
  lightBlueOp50: 'rgba(10, 129, 153, 0.5)',
  purpleOp50: 'rgba(65, 35, 184, 0.5)',
  pinkOp50: 'rgba(219, 57, 159, 0.5)',

  // Fonts
  SFUITextRegular: 'SF-UI-Text-Regular',
  fontLight: 'NunitoSans-Light',
  fontRegular: 'NunitoSans-Regular',
  fontBold: 'NunitoSans-Bold'
}

const deviceWidth = Dimensions.get('window').width

export const coinhubDark: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: true,
  preferPrimaryButton: false,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.white,
  iconTappable: palette.coinhubOrange,
  iconDeactivated: palette.whiteOp75,
  dangerIcon: palette.accentRed,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  loadingIcon: palette.coinhubOrange,

  // Background
  backgroundGradientColors: [palette.darkerBlue, palette.darkBlue],
  backgroundGradientStart: { x: 1, y: 0 },
  backgroundGradientEnd: { x: 0, y: 0 },
  backgroundDots: {
    blurRadius: scale(80),
    dotOpacity: 0.1,
    dots: [
      // {
      //   // Top-left:
      //   color: palette.transparent,
      //   cx: '10%',
      //   cy: '10%',
      //   r: scale(80)
      // },
      // {
      //   // Mid-right:
      //   color: palette.transparent,
      //   cx: '95%',
      //   cy: '30%',
      //   r: scale(90)
      // },
      // {
      //   // Bottom-left:
      //   color: palette.transparent,
      //   cx: '-15%',
      //   cy: '100%',
      //   r: scale(220)
      // }
    ],
    assetOverrideDots: [undefined, { accentColor: 'iconAccentColor' }, null]
  },
  assetBackgroundGradientColors: [palette.darkerBlue, palette.darkBlue],
  assetBackgroundGradientStart: { x: 0, y: 0 },
  assetBackgroundGradientEnd: { x: 0, y: 1 },
  assetBackgroundColorScale: 0.15,
  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0,

  // Modal
  modal: palette.coinhubNavy,
  modalCloseIcon: palette.coinhubOrange,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,
  modalBackground: palette.coinhubNavyOp50,
  modalSceneOverlayColor: palette.black,
  modalDragbarColor: palette.darkGrayOp30,

  modalLikeBackground: palette.darkGray,

  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.fontBold,

  // Tile
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [`#000000aa`, `#00000000`],
  // Commenting out will remove background gradient:
  listSectionHeaderBackgroundGradientStart: null,
  listSectionHeaderBackgroundGradientEnd: null,

  // Text
  primaryText: palette.white,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  negativeDeltaText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.coinhubOrange,
  deactivatedText: palette.gray,
  emphasizedText: palette.coinhubOrange,

  // emphasizedText: palette.coinhubOrange,

  // Header
  headerIcon: coinhubLogo,
  headerBackground: [palette.darkBlueOp50, palette.darkerBlueOp50],
  headerBackgroundStart: { x: 0, y: 0 },
  headerBackgroundEnd: { x: 1, y: 0 },
  headerOutlineColors: [palette.transparent, palette.transparent],

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 1.5,
  addButtonFont: palette.fontBold,

  keypadButtonOutline: palette.coinhubOrange,
  keypadButtonOutlineWidth: 1,
  keypadButton: [palette.transparent, palette.transparent],
  keypadButtonColorStart: { x: 0, y: 0 },
  keypadButtonColorEnd: { x: 1, y: 1 },
  keypadButtonText: palette.coinhubOrange,
  keypadButtonTextShadow: textNoShadow,
  keypadButtonShadow: themeNoShadow,
  keypadButtonBorderRadiusRem: 1,
  keypadButtonFontSizeRem: 1,
  keypadButtonFont: palette.fontBold,

  primaryButtonOutline: palette.transparent,
  primaryButtonOutlineWidth: 1,
  primaryButton: [palette.coinhubBlue, palette.coinhubBlue],
  primaryButtonColorStart: { x: 0, y: 0 },
  primaryButtonColorEnd: { x: 1, y: 0 },
  primaryButtonText: palette.coinhubNavy,
  primaryButtonTextShadow: textNoShadow,
  primaryButtonShadow: themeNoShadow,
  primaryButtonFontSizeRem: 1,
  primaryButtonFont: palette.fontBold,

  secondaryButtonOutline: palette.graySecondary,
  secondaryButtonOutlineWidth: 0,
  secondaryButton: [palette.graySecondary, palette.graySecondary],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.white,
  secondaryButtonTextShadow: textNoShadow,
  secondaryButtonShadow: themeNoShadow,
  secondaryButtonFontSizeRem: 1,
  secondaryButtonFont: palette.fontRegular,

  escapeButtonOutline: palette.transparent,
  escapeButtonOutlineWidth: 0,
  escapeButton: [palette.transparent, palette.transparent],
  escapeButtonColorStart: { x: 0, y: 0 },
  escapeButtonColorEnd: { x: 1, y: 1 },
  escapeButtonText: palette.coinhubOrange,
  escapeButtonTextShadow: textNoShadow,
  escapeButtonShadow: themeNoShadow,
  escapeButtonFontSizeRem: 1,
  escapeButtonFont: palette.fontRegular,

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
  pinUsernameButtonFont: palette.fontRegular,

  // Dropdown colors:
  dropdownWarning: palette.accentOrange,
  dropdownError: palette.accentRed,
  dropdownText: palette.white,

  // Card
  cardBorder: 1,
  cardBorderColor: palette.whiteOp10,
  cardBorderRadius: 16,
  cardTextShadow: {
    textShadowColor: palette.blackOp50,
    textShadowOffset: {
      width: 0,
      height: 0
    },
    textShadowRadius: 3
  },

  tabBarBackground: [palette.darkBlueOp50, palette.darkerBlueOp50],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 0 },
  tabBarTopOutlineColors: [palette.darkerBlue, palette.darkerBlue],
  tabBarIcon: palette.white,
  tabBarIconHighlighted: palette.coinhubOrange,

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

  shimmerBackgroundColor: palette.whiteOp05,
  shimmerBackgroundHighlight: palette.whiteOp10,

  toggleButton: palette.coinhubOrange,
  toggleButtonOff: palette.gray,

  // Confirmation slider
  confirmationSlider: palette.whiteOp05,
  confirmationSliderCompleted: palette.darkGreen,
  confirmationSliderText: palette.white,
  confirmationSliderArrow: palette.darkerBlue,
  confirmationSliderThumb: palette.coinhubBlue,
  confirmationSliderTextDeactivated: palette.gray,
  confirmationThumbDeactivated: palette.gray,
  confirmationSliderWidth: deviceWidth >= 340 ? 295 : deviceWidth - 45,
  confirmationSliderThumbWidth: 55,

  // Lines
  lineDivider: palette.coinhubOrangeOp25,
  titleLineDivider: palette.coinhubOrange,
  thinLineWidth: 1,
  mediumLineWidth: 2,
  thickLineWidth: 3,

  // DividerLine component
  dividerLineHeight: 1,
  dividerLineColors: [palette.coinhubOrange, palette.coinhubOrange],

  // Settings Row
  settingsRowBackground: palette.transparent,
  settingsRowPressed: palette.transparent,
  settingsRowHeaderFont: palette.fontBold,
  settingsRowHeaderFontSizeRem: 1,
  settingsRowSubHeader: palette.transparent,

  // Native iOS date modal:
  dateModalTextLight: palette.accentBlue,
  dateModalTextDark: palette.white,
  dateModalBackgroundLight: palette.white,
  dateModalBackgroundDark: palette.darkerBlue,

  // Wallet Icon Progress
  walletProgressIconFill: palette.coinhubOrange,
  walletProgressIconDone: palette.white,

  // Misc
  // pressedOpacity: 0.25, // Should be removed when press colors are given to buttons and links
  searchListRefreshControlIndicator: palette.transparent,
  clipboardPopupText: palette.black,

  // Fonts
  fontFaceDefault: palette.fontRegular,
  fontFaceMedium: palette.fontBold,
  fontFaceBold: palette.fontBold,
  fontFaceSymbols: Platform.OS === 'android' ? palette.SFUITextRegular : palette.fontRegular,

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
  textInputTextColor: palette.white,
  textInputTextColorDisabled: palette.gray,
  textInputTextColorFocused: palette.white,
  textInputBackgroundColor: palette.graySecondary,
  textInputBackgroundColorDisabled: palette.transparent,
  textInputBackgroundColorFocused: palette.graySecondary,
  textInputBorderColor: `${palette.blueGray}00`,
  textInputBorderColorDisabled: palette.gray,
  textInputBorderColorFocused: palette.coinhubOrange,
  textInputBorderRadius: 100,
  textInputBorderWidth: 1,
  textInputIconColor: palette.whiteOp50,
  textInputIconColorDisabled: palette.whiteOp50,
  textInputIconColorFocused: palette.coinhubOrange,
  textInputPlaceholderColor: palette.whiteOp50,
  textInputPlaceholderColorDisabled: palette.whiteOp50,
  textInputPlaceholderColorFocused: palette.whiteOp50,

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

  primaryLogo: coinhubLogo,
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
    colors: [palette.transparent, palette.transparent, palette.transparent],
    end: { x: 1, y: 0 },
    start: { x: 0, y: 1 }
  },
  cardOverlayDisabled: palette.blackOp65,

  // Special Home Scene Tiled Cards
  buyCardGradient: {
    colors: [palette.transparent, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  sellCardGradient: {
    colors: [palette.transparent, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  earnCardGradient: {
    colors: [palette.greenOp50, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },
  swapCardGradient: {
    colors: [palette.transparent, palette.transparent],
    end: { x: 0, y: 1 },
    start: { x: 1, y: 0 }
  },

  txDirBgReceive: palette.greenOp60,
  txDirBgSend: palette.redOp60,
  txDirBgSwap: palette.blueGrayOp70,
  txDirFgReceive: palette.lightGreen,
  txDirFgSend: palette.lightRed,
  txDirFgSwap: palette.blueGray
}
