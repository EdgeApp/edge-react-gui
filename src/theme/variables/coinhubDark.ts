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
  coinhubBlue: '#26a9e1',
  coinhubNavy: '#0D2145',
  coinhubOrange: '#e27226',
  coinhubOrangeOp25: '#e2722640',
  darkBlue: '#204A70',
  darkerBlue: '#1C2E4F',
  darkOrange: '#211D1A',

  blueGray: '#A5D4FF',
  gray: '#87939E',
  lightGray: '#D9E3ED',
  mutedBlue: '#2F5E89',
  accentGreen: '#77C513',
  accentRed: '#E85466',
  accentBlue: '#0073D9',
  accentOrange: '#F1AA19',

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
  transactionListIconBackground: palette.coinhubNavy,
  buySellCustomPluginModalIcon: palette.coinhubNavy,

  // Background
  backgroundGradientColors: [palette.darkerBlue, palette.darkBlue],
  backgroundGradientStart: { x: 0, y: 0 },
  backgroundGradientEnd: { x: 1, y: 0 },
  backgroundImageServerUrls: ['https://content.edge.app/coinhub'],
  backgroundImage: undefined,
  backgroundLoadingOverlay: 'rgba(123,123,123,.2)',

  // Camera Overlay
  cameraOverlayColor: palette.black,
  cameraOverlayOpStart: 0.7,
  cameraOverlayOpEnd: 0.3,

  // Modal
  modal: palette.coinhubNavy,
  modalCloseIcon: palette.coinhubOrange,
  modalBorderColor: palette.transparent,
  modalBorderWidth: 0,
  modalBorderRadiusRem: 1,

  sideMenuColor: palette.coinhubNavy,
  sideMenuBorderColor: palette.transparent,
  sideMenuBorderWidth: 0,
  sideMenuFont: palette.fontBold,

  // Tile
  tileBackground: palette.transparent,
  tileBackgroundMuted: palette.transparent,

  // Section Lists
  listSectionHeaderBackgroundGradientColors: [palette.darkerBlue, palette.darkBlue],
  listSectionHeaderBackgroundGradientStart: { x: 0, y: 0 },
  listSectionHeaderBackgroundGradientEnd: { x: 1, y: 0 },

  // WalletList - TODO: Remove as unused
  walletListBackground: palette.transparent,
  walletListMutedBackground: palette.transparent,

  // Text
  primaryText: palette.white,
  secondaryText: palette.blueGray,
  warningText: palette.accentOrange,
  positiveText: palette.accentGreen,
  negativeText: palette.accentRed,
  dangerText: palette.accentRed,
  textLink: palette.coinhubOrange,
  deactivatedText: palette.gray,
  emphasizedText: palette.coinhubOrange,

  // emphasizedText: palette.coinhubOrange,

  // Header
  headerIcon: coinhubLogo,

  // Buttons
  // Should add palette when pressed
  buttonBorderRadiusRem: 0.25,
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

  secondaryButtonOutline: palette.coinhubOrange,
  secondaryButtonOutlineWidth: 1.5,
  secondaryButton: [palette.transparent, palette.transparent],
  secondaryButtonColorStart: { x: 0, y: 0 },
  secondaryButtonColorEnd: { x: 1, y: 1 },
  secondaryButtonText: palette.coinhubOrange,
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
  cardBorderRadius: 4,

  tabBarBackground: [palette.darkerBlue, palette.darkerBlue],
  tabBarBackgroundStart: { x: 0, y: 0 },
  tabBarBackgroundEnd: { x: 1, y: 1 },
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
  settingsRowHeaderBackground: [palette.darkerBlue, palette.darkerBlue],
  settingsRowHeaderBackgroundStart: { x: 0, y: 0 },
  settingsRowHeaderBackgroundEnd: { x: 1, y: 1 },
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
  flipInputBorder: palette.blueGray,

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

  // Outline Text Input
  outlineTextInputColor: palette.transparent,
  outlineTextInputTextColor: palette.white,
  outlineTextInputBorderWidth: 1,
  outlineTextInputBorderColor: palette.blueGray,
  outlineTextInputBorderColorDisabled: palette.gray,
  outlineTextInputBorderColorFocused: palette.coinhubOrange,
  outlineTextInputLabelColor: palette.blueGray,
  outlineTextInputLabelColorDisabled: palette.gray,
  outlineTextInputLabelColorFocused: palette.coinhubOrange,

  // Animation
  fadeDisable: palette.gray,

  // Images
  iconServerBaseUri: EDGE_CONTENT_SERVER_URI,

  paymentTypeLogoApplePay: paymentTypeLogoApplePay,
  paymentTypeLogoAuspost: paymentTypeLogoAuspost,
  paymentTypeLogoBankTransfer: paymentTypeLogoBankTransfer,
  paymentTypeLogoCash: paymentTypeLogoCash,
  paymentTypeLogoCreditCard: paymentTypeLogoCreditCard,
  paymentTypeLogoDebitCard: paymentTypeLogoDebitCard,
  paymentTypeLogoFasterPayments: paymentTypeLogoFasterPayments,
  paymentTypeLogoGiftCard: paymentTypeLogoGiftCard,
  paymentTypeLogoGooglePay,
  paymentTypeLogoIdeal: paymentTypeLogoIdeal,
  paymentTypeLogoInterac: paymentTypeLogoInterac,
  paymentTypeLogoPayid: paymentTypeLogoPayid,
  paymentTypeLogoPaynow,
  paymentTypeLogoPix,
  paymentTypeLogoPoli: paymentTypeLogoPoli,
  paymentTypeLogoSofort: paymentTypeLogoSofort,
  paymentTypeLogoUpi: paymentTypeLogoUpi,
  paymentTypeVisa,

  primaryLogo: coinhubLogo,
  fioAddressLogo: fioAddressLogo,
  walletListSlideTutorialImage: walletListSlidingTutorial,

  guiPluginLogoMoonpay: guiPluginLogoMoonpay
}
