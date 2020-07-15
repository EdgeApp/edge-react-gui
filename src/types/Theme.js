// @flow

export type Theme = {
  // The app scaling factor, which is the height of "normal" text:
  rem(size: number): number,

  // Background colors:
  background1: string,
  background2: string,
  modalBody: string,
  modalBackgroundShadow: string,
  modalBackgroundShadowOpacity: number,

  // Text colors:
  accentTextNegative: string,
  accentTextPositive: string,
  headerText: string,
  primaryText: string,
  secondaryText: string,
  disabledText: string,

  // Tile colors:
  lineDivider: string,
  tileBackground: string,
  tileIcon: string,
  tileMore: string,

  // Button colors:
  modalClose: string,
  cancelButton: string,
  primaryButton: string,
  primaryButtonText: string,
  secondaryButtonOutline: string,
  secondaryButtonText: string,
  selectButtonOutline: string,
  selectButtonText: string,

  // Misc colors:
  transparent: string,
  keyboardTopViewBackgroundDefault: string,
  keyboardTopViewBackgroundDark: string,
  keyboardTopViewTextDefault: string,
  keyboardTopViewTextDark: string,
  datetimepickerBackgroundDefault: string,
  datetimepickerBackgroundDark: string,

  // Fonts
  fontFaceDefault: string,
  fontFaceBold: string,
  fontFaceSymbols: string,

  // Settings theme:
  settingsIconColor: string,
  settingsIconMintColor: string,
  settingsHeaderRowBackground: string,
  settingsTextMintColor: string,
  settingsRowBackground: string,
  settingsSwitchEnabledBackground: string,
  settingsSwitchDisabledBackground: string,
  settingsButtonBackgroud: string,
  settingsButtonText: string
}
