// @flow

// Commented themes are not used
export type Theme = {
  // The app scaling factor, which is the height of "normal" text:
  rem(size: number): number,

  // Used to control the OS status bar, modal blur,
  // and other binary light / dark choices:
  isDark: boolean,

  // Common border
  defaultBorderColor: string,

  // Icons
  icon: string,
  iconTappable: string,
  iconDeactivated: string,
  warningIcon: string,
  iconLoadingOverlay: string,
  transactionListIconBackground: string,
  buySellCustomPluginModalIcon: string,

  // Background
  backgroundGradientLeft: string,
  backgroundGradientRight: string,

  // Camera Overlay
  cameraOverlayColor: string,
  cameraOverlayOpStart: number,
  cameraOverlayOpEnd: number,

  // Modal
  modal: string,
  modalCloseIcon: string,
  // modalFullGradientLeft: string,
  // modalFullGradientRight: string,

  // Tile
  // listHeaderBackground: string,
  tileBackground: string,
  tileBackgroundMuted: string,
  // listSectionHeaderBackground: string,

  // NOTE: List of components/screens that uses the tileBackground
  // - promoCard
  // - scanTile
  // - addressTile
  // - scanModal
  // - fioDomainSettings
  // - otpSettingsKey
  // - tileComponent

  // WalletList
  walletListBackground: string,
  walletListMutedBackground: string,

  // Settings Row
  settingsRowBackground: string,
  settingsRowPressed: string,
  settingsRowHeaderBackground: string,
  settingsRowSubHeader: string,

  // Text
  primaryText: string,
  secondaryText: string,
  warningText: string,
  positiveText: string,
  negativeText: string,
  dangerText: string,
  textLink: string,
  deactivatedText: string,
  // listHeaderText: string,

  // Header
  // headerText: string,
  // hamburgerButton: string,
  // backButton: string,

  // Buttons
  primaryButtonOutline: string,
  primaryButton: string,
  primaryButtonText: string,
  // primaryButtonDeactivated: string,

  secondaryButtonOutline: string,
  secondaryButton: string,
  secondaryButtonText: string,

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

  buttonBoxShadow: string,

  // Card
  // cardBackground: string,
  // cardShadow: string,
  cardBorder: number,
  cardBorderColor: string,
  cardBorderRadius: number,

  tabBarBackground: string,
  tabBarIcon: string,
  tabBarIconHighlighted: string,

  sliderTabSend: string,
  sliderTabRequest: string,
  sliderTabMore: string,

  // pinOutline: string,
  // pinFilled: string,

  // radioButtonOutline: string,
  // radioButtonFilled: string,

  toggleButton: string,
  toggleButtonOff: string,
  // toggleButtonThumb: string,

  // warningBubble: string,

  // Confirmation slider
  confirmationSlider: string,
  confirmationSliderText: string,
  confirmationSliderArrow: string,
  confirmationSliderThumb: string,
  confirmationSliderTextDeactivated: string,
  confirmationThumbDeactivated: string,
  confirmationSliderWidth: number,
  confirmationSliderThumbWidth: number,

  // Lines
  lineDivider: string,
  titleLineDivider: string,
  // textInputLine: string,
  // orLine: string,
  // tileDivider: string,
  thinLineWidth: number,
  mediumLineWidth: number,

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
  dateModalTextLight: string,
  dateModalTextDark: string,
  dateModalBackgroundLight: string,
  dateModalBackgroundDark: string,

  // Wallet Icon Progress
  walletProgressIconFill: string,
  walletProgressIconFillDone: string,
  walletProgressIconBackground: string,

  // Misc
  // pressedOpacity: number,
  searchListRefreshControlIndicator: string,
  clipboardPopupText: string,
  flipInputBorder: string,

  // Fonts
  fontFaceDefault: string,
  fontFaceMedium: string,
  fontFaceBold: string,
  fontFaceSymbols: string,

  // TouchableHighlights underlay
  underlayColor: string,
  underlayOpacity: number,

  // Tutorials
  tutorialModalUnderlay: string,

  // QR code
  qrForegroundColor: string,
  qrBackgroundColor: string,

  // Picker Color
  pickerTextDark: string,
  pickerTextLight: string,

  // Input Accessory
  inputAccessoryBackground: string,
  inputAccessoryText: string,

  // Animation
  fadeDisable: string,

  // Images
  settingsChangellyLogo: string,
  settingsChangenowLogo: string,
  settingsDefaultLogo: string,
  settingsExolixLogo: string,
  settingsFoxExchangeLogo: string,
  settingsGodexLogo: string,
  settingsSwitchainLogo: string,
  settingsSideshiftLogo: string,
  settingsTotleLogo: string,

  paymentTypeLogoApplePay: string,
  paymentTypeLogoAuspost: string,
  paymentTypeLogoBankgirot: string,
  paymentTypeLogoBankTransfer: string,
  paymentTypeLogoCash: string,
  paymentTypeLogoCreditCard: string,
  paymentTypeLogoDebitCard: string,
  paymentTypeLogoFasterPayments: string,
  paymentTypeLogoGiftCard: string,
  paymentTypeLogoIdeal: string,
  paymentTypeLogoInterac: string,
  paymentTypeLogoNewsagent: string,
  paymentTypeLogoPayid: string,
  paymentTypeLogoPoli: string,
  paymentTypeLogoSofort: string,
  paymentTypeLogoSwish: string,
  paymentTypeLogoUpi: string,

  fioAddressLogo: string,
  walletListSlideTutorialImage: string,

  guiPluginLogoBitaccess: string,
  guiPluginLogoMoonpay: string
}
