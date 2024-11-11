import { asNumber, asObject } from 'cleaners'

import { AccentColors } from '../components/common/DotsBackground'

export type ImageProp = { uri: string } | number

export interface ThemeDot {
  accentColor?: keyof AccentColors
  color: string
  cx: number | string
  cy: number | string
  r: number
}

// Updates to dots. undefined keeps the dots, null deletes them
export type OverrideDots = Array<Partial<ThemeDot> | undefined | null>

interface ThemeGradientParams {
  colors: string[]
  start: GradientCoords
  end: GradientCoords
}

interface ThemeShadowParams {
  shadowColor: string
  shadowOffset: {
    width: number
    height: number
  }
  shadowOpacity: number
  shadowRadius: number
  /** @deprecated Android-specific prop no longer needed. */
  elevation: number
}

/** @depreated Use textShadow props from text-shadow-component */
interface TextShadowParams {
  textShadowColor: string
  textShadowOffset: {
    width: number
    height: number
  }
  textShadowRadius: number
}

const asGradientCoords = asObject({
  x: asNumber,
  y: asNumber
})
type GradientCoords = ReturnType<typeof asGradientCoords>

export const themeNoShadow: ThemeShadowParams = {
  shadowColor: '#000000',
  shadowOffset: {
    width: 0,
    height: 0
  },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0
}

export const textNoShadow: TextShadowParams = {
  textShadowColor: '#000000',
  textShadowOffset: {
    width: 0,
    height: 0
  },
  textShadowRadius: 0
}

// Commented themes are not used
export interface Theme {
  // The app scaling factor, which is the height of "normal" text:
  rem: (size: number) => number

  // Prefer using at the Primary button style when there is only one button option on a
  // scene or modal. Edge prefers the Secondary button style and uses the Primary button sparingly
  // since it uses a loud solid mint color.
  preferPrimaryButton: boolean

  // Used to control the OS status bar, modal blur,
  // and other binary light / dark choices:
  isDark: boolean

  // Common border
  defaultBorderColor: string

  // Icons
  icon: string
  iconTappable: string
  iconDeactivated: string
  warningIcon: string
  dangerIcon: string
  iconLoadingOverlay: string
  loadingIcon: string

  // Background
  backgroundGradientColors: string[]
  backgroundGradientStart: { x: number; y: number }
  backgroundGradientEnd: { x: number; y: number }
  backgroundDots: {
    blurRadius: number
    dotOpacity: number
    dots: ThemeDot[]
    assetOverrideDots: OverrideDots
  }
  assetBackgroundGradientColors: string[]
  assetBackgroundGradientStart: { x: number; y: number }
  assetBackgroundGradientEnd: { x: number; y: number }
  assetBackgroundColorScale: number

  // Camera Overlay
  cameraOverlayColor: string
  cameraOverlayOpStart: number
  cameraOverlayOpEnd: number

  // Modal
  modal: string
  modalCloseIcon: string
  modalBorderColor: string
  modalBorderWidth: number
  modalBorderRadiusRem: number
  modalBackground: string
  modalSceneOverlayColor: string
  modalDragbarColor: string

  // Modal content backgrounds have a number of dynamic layers that affect the
  // resulting color.
  // This color represents an approximation of a modal's background color
  modalLikeBackground: string

  sideMenuBorderColor: string
  sideMenuBorderWidth: number
  sideMenuFont: string

  // Tile
  // listHeaderBackground: string,
  tileBackground: string
  tileBackgroundMuted: string

  // Section Lists
  listSectionHeaderBackgroundGradientColors: string[]
  listSectionHeaderBackgroundGradientStart: { x: number; y: number } | null
  listSectionHeaderBackgroundGradientEnd: { x: number; y: number } | null

  // NOTE: List of components/screens that uses the tileBackground
  // - promoCard
  // - scanTile
  // - addressTile
  // - scanModal
  // - fioDomainSettings
  // - otpSettingsKey
  // - tileComponent

  // Settings Row
  settingsRowBackground: string
  settingsRowPressed: string

  settingsRowHeaderFont: string
  settingsRowHeaderFontSizeRem: number
  settingsRowSubHeader: string

  // Text
  primaryText: string
  secondaryText: string
  warningText: string
  positiveText: string
  negativeText: string
  negativeDeltaText: string
  dangerText: string
  textLink: string
  deactivatedText: string
  emphasizedText: string
  // listHeaderText: string,

  // Header
  headerIcon: ImageProp
  headerBackground: string[]
  headerBackgroundStart: GradientCoords
  headerBackgroundEnd: GradientCoords
  headerOutlineColors: string[]

  // Buttons
  buttonBorderRadiusRem: number
  addButtonFont: string

  keypadButtonOutline: string
  keypadButtonOutlineWidth: number
  keypadButton: string[]
  keypadButtonColorStart: GradientCoords
  keypadButtonColorEnd: GradientCoords
  keypadButtonText: string
  keypadButtonTextShadow: TextShadowParams
  keypadButtonShadow: ThemeShadowParams
  keypadButtonBorderRadiusRem: number
  keypadButtonFontSizeRem: number
  keypadButtonFont: string

  primaryButtonOutline: string
  primaryButtonOutlineWidth: number
  primaryButton: string[]
  primaryButtonColorStart: GradientCoords
  primaryButtonColorEnd: GradientCoords
  primaryButtonText: string
  primaryButtonTextShadow: TextShadowParams
  primaryButtonShadow: ThemeShadowParams
  primaryButtonFontSizeRem: number
  primaryButtonFont: string

  secondaryButtonOutline: string
  secondaryButtonOutlineWidth: number
  secondaryButton: string[]
  secondaryButtonColorStart: GradientCoords
  secondaryButtonColorEnd: GradientCoords
  secondaryButtonText: string
  secondaryButtonTextShadow: TextShadowParams
  secondaryButtonShadow: ThemeShadowParams
  secondaryButtonFontSizeRem: number
  secondaryButtonFont: string

  escapeButtonOutline: string
  escapeButtonOutlineWidth: number
  escapeButton: string[]
  escapeButtonColorStart: GradientCoords
  escapeButtonColorEnd: GradientCoords
  escapeButtonText: string
  escapeButtonTextShadow: TextShadowParams
  escapeButtonShadow: ThemeShadowParams
  escapeButtonFontSizeRem: number
  escapeButtonFont: string

  pinUsernameButtonOutline: string
  pinUsernameButtonOutlineWidth: number
  pinUsernameButton: string[]
  pinUsernameButtonColorStart: GradientCoords
  pinUsernameButtonColorEnd: GradientCoords
  pinUsernameButtonText: string
  pinUsernameButtonTextShadow: TextShadowParams
  pinUsernameButtonShadow: ThemeShadowParams
  pinUsernameButtonBorderRadiusRem: number
  pinUsernameButtonFontSizeRem: number
  pinUsernameButtonFont: string

  // Dropdown colors:
  dropdownWarning: string
  dropdownError: string
  dropdownText: string

  // tertiaryButtonOutline: string,
  // tertiaryButton: string,
  // tertiaryButtonText: string,

  // glassButton: string,
  // glassButtonIcon: string,
  // glassButtonDark: string,
  // glassButtonDarkIcon: string,

  // dangerButtonOutline: string,
  // dangerButton: string,
  // dangerButtonText: string,

  // Card
  // cardBackground: string,
  // cardShadow: string,
  cardBorder: number
  cardBorderColor: string
  cardBorderRadius: number
  cardTextShadow: TextShadowParams // For added contrast against complex card backgrounds

  tabBarBackground: string[]
  tabBarBackgroundStart: GradientCoords
  tabBarBackgroundEnd: GradientCoords
  tabBarTopOutlineColors: string[]
  tabBarIcon: string
  tabBarIconHighlighted: string

  sliderTabSend: string
  sliderTabRequest: string
  sliderTabMore: string

  // Shimmer
  shimmerBackgroundColor: string
  shimmerBackgroundHighlight: string

  // pinOutline: string,
  // pinFilled: string,

  // radioButtonOutline: string,
  // radioButtonFilled: string,

  toggleButton: string
  toggleButtonOff: string
  // toggleButtonThumb: string,

  // warningBubble: string,

  // Confirmation slider background left of thumb
  confirmationSlider: string

  // Section of slider to right of thumb
  confirmationSliderCompleted: string

  confirmationSliderText: string
  confirmationSliderArrow: string
  confirmationSliderThumb: string
  confirmationSliderTextDeactivated: string
  confirmationThumbDeactivated: string
  confirmationSliderWidth: number
  confirmationSliderThumbWidth: number

  // Lines
  lineDivider: string
  titleLineDivider: string
  // textInputLine: string,
  // orLine: string,
  // tileDivider: string,
  thinLineWidth: number
  mediumLineWidth: number
  thickLineWidth: number

  // DividerLine component
  dividerLineHeight: number
  dividerLineColors: string[]

  // Notifications
  // notificationBackground: string,
  // messageBanner: string,
  // bubble: string,

  // Alert Modal
  // securityAlertModalHeaderIcon: string,
  // securityAlertModalRowBorder: string,
  // securityAlertModalWarningIcon: string,
  // securityAlertModalDangerIcon: string,
  // securityAlertModalBackground: string,
  // securityAlertModalText: string,
  // securityAlertModalLine: string,
  // securityAlertModalHeaderIconShadow: string,

  // Native iOS date modal:
  dateModalTextLight: string
  dateModalTextDark: string
  dateModalBackgroundLight: string
  dateModalBackgroundDark: string

  // Wallet Icon Progress
  walletProgressIconFill: string
  walletProgressIconDone: string

  // Misc
  // pressedOpacity: number,
  searchListRefreshControlIndicator: string
  clipboardPopupText: string

  // Fonts
  fontFaceDefault: string
  fontFaceMedium: string
  fontFaceBold: string
  fontFaceSymbols: string

  // TouchableHighlights underlay
  underlayColor: string
  underlayOpacity: number

  // TouchableHighlights overlay
  overlayDisabledColor: string
  overlayDisabledTextColor: string

  // Tutorials
  tutorialModalUnderlay: string

  // QR code
  qrForegroundColor: string
  qrBackgroundColor: string

  // Picker Color
  pickerText: string

  // Native Android components like Pickers need specific text colors that
  // contrast with the OS light or dark theme
  nativeComponentTextLight: string // Text color when Android theme is light
  nativeComponentTextDark: string // Text color when Android theme is dark

  // Input Accessory
  inputAccessoryBackground: string
  inputAccessoryText: string

  // Text Input
  textInputTextColor: string
  textInputTextColorDisabled: string
  textInputTextColorFocused: string
  textInputBackgroundColor: string
  textInputBackgroundColorDisabled: string
  textInputBackgroundColorFocused: string
  textInputBorderWidth: number
  textInputBorderColor: string
  textInputBorderColorDisabled: string
  textInputBorderColorFocused: string
  textInputBorderRadius: number
  textInputIconColor: string
  textInputIconColorDisabled: string
  textInputIconColorFocused: string
  textInputPlaceholderColor: string
  textInputPlaceholderColorDisabled: string
  textInputPlaceholderColorFocused: string

  // Animation
  fadeDisable: string

  // Images
  iconServerBaseUri: string

  paymentTypeLogoApplePay: ImageProp
  paymentTypeLogoAuspost: ImageProp
  paymentTypeLogoBankTransfer: ImageProp
  paymentTypeLogoCash: ImageProp
  paymentTypeLogoCreditCard: ImageProp
  paymentTypeLogoDebitCard: ImageProp
  paymentTypeLogoFasterPayments: ImageProp
  paymentTypeLogoGiftCard: ImageProp
  paymentTypeLogoGooglePay: ImageProp
  paymentTypeLogoIdeal: ImageProp
  paymentTypeLogoInterac: ImageProp
  paymentTypeLogoPayid: ImageProp
  paymentTypeLogoPaynow: ImageProp
  paymentTypeLogoPaypal: ImageProp
  paymentTypeLogoPix: ImageProp
  paymentTypeLogoPoli: ImageProp
  paymentTypeLogoRevolut: ImageProp
  paymentTypeLogoSofort: ImageProp
  paymentTypeLogoUpi: ImageProp
  paymentTypeVisa: ImageProp

  primaryLogo: ImageProp
  fioAddressLogo: ImageProp
  walletListSlideTutorialImage: ImageProp

  guiPluginLogoMoonpay: ImageProp

  // UI 4.0:

  // Shadows
  iconShadow: ThemeShadowParams
  dropdownListShadow: ThemeShadowParams
  notifcationCardShadow: ThemeShadowParams

  // Basic Card Styles
  cardBaseColor: string
  cardGradientWarning: ThemeGradientParams
  cardGradientError: ThemeGradientParams
  cardGradientLearn: ThemeGradientParams
  cardOverlayDisabled: string

  // Special Home Scene Tiled Cards
  buyCardGradient: ThemeGradientParams
  sellCardGradient: ThemeGradientParams
  earnCardGradient: ThemeGradientParams
  swapCardGradient: ThemeGradientParams

  txDirBgReceive: string
  txDirBgSend: string
  txDirBgSwap: string
  txDirFgReceive: string
  txDirFgSend: string
  txDirFgSwap: string
}
