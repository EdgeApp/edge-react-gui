# Optimize time to execute initializeAccount

- Do not write defaults in readSyncedSettings if the file doesn't exist. Defaults can be derived from cleaners. Only write if values are different than defaults.
- Remove default currency denom values from being written to settings file. Currently the app loops over all coins/tokens to write their denom values to the settings json. Instead:
  - Read the settings
  - See which values are different than the default and delete any that match the default
  - Write back the file with only non-default values.
  - All accesses of the denom file should only use a fallback default if the file doesn't have a denom for the asset
- Remove scamWarningModal from initializeAccount
- Remove calls to get biometric/touchid/faceid enable/available state from initializeAccount. Move to SettingsScene only since that's where it is accessed
