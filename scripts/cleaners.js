// @flow

import {
  asJSON,
  asMap,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'

/**
 * The deploy-config file holds a map of these entries inside itself.
 */
export const asReleaseConfig = asObject({
  // Release notes:
  productName: asString,

  // iOS build:
  appleDeveloperTeamId: asString,
  xcodeProject: asString,
  xcodeWorkspace: asString,
  xcodeScheme: asString,

  // Android build:
  androidKeyStore: asString,
  androidKeyStoreAlias: asString,
  androidKeyStorePassword: asString,
  androidTask: asString,

  // Bugsnag:
  bugsnagApiKey: asOptional(asString),

  // AppCenter:
  appCenterAppName: asOptional(asString),
  appCenterApiToken: asOptional(asString),
  appCenterGroupName: asOptional(asString),
  appCenterDistroGroup: asOptional(asString),
  ios: asMap(asObject({ appCenterAppName: asString })),
  android: asMap(asObject({ appCenterAppName: asString })),

  // Maps from branch names to env.json settings:
  envJson: asOptional(asMap(asMap(asUnknown)), {})
})
export type ReleaseConfig = $Call<typeof asReleaseConfig>

/**
 * deploy-config.json
 */
export const asReleaseConfigFile = asJSON(asMap(asReleaseConfig))
export type ReleaseConfigFile = $Call<typeof asReleaseConfigFile>

/**
 * release-version.json
 */
export const asVersionFile = asJSON(
  asObject({
    branch: asOptional(asString),
    build: asNumber,
    version: asString
  })
)
export type VersionFile = $Call<typeof asVersionFile>

/**
 * Legacy build number files on the Jenkins server.
 */
export const asLegacyBuildNumFile = asJSON(
  asObject({
    buildNum: asString
  })
)
export type LegacyBuildNumFile = $Call<typeof asLegacyBuildNumFile>
