import * as Application from 'expo-application'
import * as Device from 'expo-device'

/**
 * Device and app identity via expo-application / expo-device.
 * login-ui and a few GUI call sites still use react-native-device-info
 * (hasNotch, getUniqueId), so that package stays linked.
 */

export const getVersion = (): string =>
  Application.nativeApplicationVersion ?? '0.0.0'

export const getBuildNumber = (): string =>
  Application.nativeBuildVersion ?? '0'

export const getBrand = (): string => Device.brand ?? 'unknown'

export const getDeviceId = (): string =>
  Device.modelId ?? Device.modelName ?? Device.productName ?? 'unknown'

export const getSystemVersion = (): string => Device.osVersion ?? '0'

export const getDeviceType = (): string => {
  switch (Device.deviceType) {
    case Device.DeviceType.DESKTOP:
      return 'Desktop'
    case Device.DeviceType.TABLET:
      return 'Tablet'
    case Device.DeviceType.TV:
      return 'Tv'
    case Device.DeviceType.PHONE:
      return 'Handset'
    default:
      return 'unknown'
  }
}
