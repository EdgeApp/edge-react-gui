// @flow

// Commented themes are not used
export type Theme = {
  // The app scaling factor, which is the height of "normal" text:
  rem(size: number): number,

  // Icons
  icon: string,
  iconTappable: string,
  warningIcon: string,
  iconLoadingOverlay: string,

  // Background
  backgroundGradientLeft: string,
  backgroundGradientRight: string,

  // Modal
  modal: string,
  modalBlurType: 'light' | 'dark',
  modalCloseIcon: string,
  // modalFullGradientLeft: string,
  // modalFullGradientRight: string,

  // Tile
  // listHeaderBackground: string,
  tileBackground: string,
  tileBackgroundMuted: string,
  // listSectionHeaderBackground: string,

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

  // cardBackground: string,
  // cardShadow: string,

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
  // confirmationSlider: string,
  // confirmationSliderText: string,
  // confirmationSliderArrow: string,
  // confirmationSliderThumb: string,
  // confirmationSliderTextDeactivated: string,
  // confirmationThumbDeactivated: string,

  // Lines
  lineDivider: string,
  // textInputLine: string,
  // orLine: string,
  // tileDivider: string,

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

  // Misc
  // pressedOpacity: number,

  // Fonts
  fontFaceDefault: string,
  fontFaceBold: string,
  fontFaceSymbols: string,

  // TouchableHighlights underlay
  underlayColor: string,
  underlayOpacity: number,

  // Images
  settingsChangellyLogo: string,
  settingsChangenowLogo: string,
  settingsCoinswitchLogo: string,
  settingsDefaultLogo: string,
  settingsFaastLogo: string,
  settingsFoxExchangeLogo: string,
  settingsGodexLogo: string,
  settingsSwitchainLogo: string,
  settingsTotleLogo: string,
  fioAddressLogo: string
}
