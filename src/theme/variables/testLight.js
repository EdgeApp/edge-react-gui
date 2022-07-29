// @flow

import { Platform } from 'react-native'

import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import guiPluginLogoBitaccess from '../../assets/images/guiPlugins/guiPluginLogoBitaccessDark.png'
import guiPluginLogoMoonpay from '../../assets/images/guiPlugins/guiPluginLogoMoonpayDark.png'
import fioAddressLogo from '../../assets/images/list_fioAddress.png'
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import paymentTypeLogoAuspost from '../../assets/images/paymentTypes/paymentTypeLogoAuspost.png'
import paymentTypeLogoBankgirot from '../../assets/images/paymentTypes/paymentTypeLogoBankgirot.png'
import paymentTypeLogoBankTransfer from '../../assets/images/paymentTypes/paymentTypeLogoBankTransfer.png'
import paymentTypeLogoCash from '../../assets/images/paymentTypes/paymentTypeLogoCash.png'
import paymentTypeLogoCreditCard from '../../assets/images/paymentTypes/paymentTypeLogoCreditCard.png'
import paymentTypeLogoDebitCard from '../../assets/images/paymentTypes/paymentTypeLogoDebitCard.png'
import paymentTypeLogoFasterPayments from '../../assets/images/paymentTypes/paymentTypeLogoFasterPayments.png'
import paymentTypeLogoGiftCard from '../../assets/images/paymentTypes/paymentTypeLogoGiftCard.png'
import paymentTypeLogoGooglePay from '../../assets/images/paymentTypes/paymentTypeLogoGooglePay.png'
import paymentTypeLogoIdeal from '../../assets/images/paymentTypes/paymentTypeLogoIdeal.png'
import paymentTypeLogoInterac from '../../assets/images/paymentTypes/paymentTypeLogoInterac.png'
import paymentTypeLogoNewsagent from '../../assets/images/paymentTypes/paymentTypeLogoNewsagent.png'
import paymentTypeLogoPayid from '../../assets/images/paymentTypes/paymentTypeLogoPayid.png'
import paymentTypeLogoPoli from '../../assets/images/paymentTypes/paymentTypeLogoPoli.png'
import paymentTypeLogoSofort from '../../assets/images/paymentTypes/paymentTypeLogoSofort.png'
import paymentTypeLogoSwish from '../../assets/images/paymentTypes/paymentTypeLogoSwish.png'
import paymentTypeLogoUpi from '../../assets/images/paymentTypes/paymentTypeLogoUpi.png'
import walletListSlidingTutorial from '../../assets/images/tutorials/walletList_sliding_light.gif'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { type Theme, textNoShadow, themeNoShadow } from '../../types/Theme.js'
import { scale } from '../../util/scaling.js'
import { PLATFORM } from './platform'

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
  QuicksandBold: 'Quicksand-Bold'
}

export const testLight: Theme = {
  rem(size: number): number {
    return Math.round(scale(16) * size)
  },
  isDark: false,
  preferPrimaryButton: true,

  // Common border
  defaultBorderColor: palette.white,

  // Icons
  icon: palette.black,
  iconTappable: palette.edgeBlue,
  iconDeactivated: palette.whiteOp75,
  warningIcon: palette.accentOrange,
  iconLoadingOverlay: palette.whiteOp75,
  transactionListIconBackground: palette.white,
  buySellCustomPluginModalIcon: palette.white,

  // Background
  backgroundGradientColors: [palette.lightestGray, palette.lightestGray],
  backgroundImageServerUrls: [],
  backgroundImage: undefined,

  // Camera Overlay
  cameraOverlayColor: palette.gray,
  cameraOverlayOpStart: 1,
  cameraOverlayOpEnd: 0.4,

  // Modal
  modal: palette.lightestGray,
  modalBlurType: 'dark',
  modalCloseIcon: palette.edgeMint,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 2,

  sideMenuColor: palette.lightestGray,
  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.QuicksandBold,

  // Tile
  // listHeaderBackground: palette.white,
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,
  // listSectionHeaderBackground: palette.white,

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
  headerIcon: fioAddressLogo,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 0.25,
  addButtonFont: palette.QuicksandBold,

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

  tabBarBackground: [palette.white, palette.edgeMint],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
  tabBarTopOutlineColors: [palette.white, palette.edgeMint],
  tabBarIcon: palette.gray,
  tabBarIconHighlighted: palette.edgeBlue,

  extraTabBarIconFont: '',
  extraTabBarIconName: '',

  sliderTabSend: palette.accentRed,
  sliderTabRequest: palette.accentGreen,
  sliderTabMore: palette.accentBlue,

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
  confirmationSliderWidth: PLATFORM.deviceWidth >= 340 ? 295 : PLATFORM.deviceWidth - 45,
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
  settingsRowHeaderBackground: palette.lightGray,
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
  outlineTextInputTextColor: palette.black,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.gray,
  outlineTextInputBorderColorFocused: palette.edgeBlue,
  outlineTextInputLabelColor: palette.gray,
  outlineTextInputLabelColorFocused: palette.edgeBlue,

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
  paymentTypeLogoGooglePay,
  paymentTypeLogoIdeal: paymentTypeLogoIdeal,
  paymentTypeLogoInterac: paymentTypeLogoInterac,
  paymentTypeLogoNewsagent: paymentTypeLogoNewsagent,
  paymentTypeLogoPayid: paymentTypeLogoPayid,
  paymentTypeLogoPoli: paymentTypeLogoPoli,
  paymentTypeLogoSofort: paymentTypeLogoSofort,
  paymentTypeLogoSwish: paymentTypeLogoSwish,
  paymentTypeLogoUpi: paymentTypeLogoUpi,

  fioAddressLogo: fioAddressLogo,
  primaryLogo: edgeLogo,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoBitaccess: guiPluginLogoBitaccess,
  guiPluginLogoMoonpay: guiPluginLogoMoonpay
}
