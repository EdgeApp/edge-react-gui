/* eslint-disable flowtype/require-valid-file-annotation */
/* globals jest */

jest.useFakeTimers()

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler() {}
}))
jest.mock('edge-currency-bitcoin', () => () => ({}))

jest.mock('rn-qr-generator', () => () => {
  return Promise.detect({})
})

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))

// force timezone to UTC
jest.mock('dateformat', () => (number, format) => require('dateformat')(number, format, true))

jest.mock('@react-native-firebase/analytics', () => () => ({
  logEvent() {},
  setUserId() {}
}))
jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission() {
    return Promise.resolve()
  }
}))
jest.mock('react-native-device-info', () => ({
  getBrand() {
    return 'Apple'
  },
  getBuildNumber() {
    return '2019010101'
  },
  getBundleId() {
    return 'co.edgesecure.app'
  },
  getDeviceId() {
    return 'iPhone7,2'
  },
  getUniqueId() {
    return 'abcd1234'
  },
  getUserAgent() {
    return Promise.resolve(
      'Mozilla/5.0 (iPhone9,3; U; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1'
    )
  },
  getVersion() {
    return '1.2.3'
  }
}))

jest.mock('edge-login-ui-rn', () => ({
  getSupportedBiometryType() {
    return 'FaceID'
  }
}))
jest.mock('react-native-share', () => 'RNShare')
jest.mock(
  'react-native-sound',
  () =>
    class Sound {
      static setCategory() {}
      play() {}
    }
)
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      FlashMode: { torch: 'torch', off: 'off' },
      Type: { back: 'back' }
    }
  }
}))
jest.mock('react-native-safari-view', () => ({
  show: () => jest.fn()
}))
jest.mock('react-native-fs', () => {
  // https://github.com/itinance/react-native-fs/issues/404
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn()
  }
})
jest.mock('react-native-localize', () => {
  return {
    getCountry() {
      return 'US'
    },
    getCurrencies() {
      return ['USD', 'EUR'] // List can sometimes be empty!
    },
    getLocales() {
      return [
        { countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false },
        { countryCode: 'FR', languageTag: 'fr-FR', languageCode: 'fr', isRTL: false }
      ]
    },
    getNumberFormatSettings() {
      return {
        decimalSeparator: '.',
        groupingSeparator: ','
      }
    }
  }
})

jest.mock('react-native-permissions', () => require('react-native-permissions/mock'))

global.__reanimatedWorkletInit = jest.fn()
for (const log in global.console) {
  global.console[log] = jest.fn()
}

jest.mock('react-native-reanimated', () => {
  return {
    ...jest.requireActual('react-native-reanimated/mock'),
    useSharedValue: jest.fn,
    useAnimatedStyle: jest.fn,
    withTiming: jest.fn,
    withSpring: jest.fn,
    withRepeat: jest.fn,
    withSequence: jest.fn,
    useAnimatedProps: jest.fn,
    Easing: {
      linear: jest.fn,
      elastic: jest.fn
    }
  }
})
