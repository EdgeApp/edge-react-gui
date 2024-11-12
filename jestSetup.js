import './node_modules/react-native-gesture-handler/jestSetup.js'

import { jest } from '@jest/globals'
import mockClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock.js'
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'

require('react-native-reanimated').setUpTests()

const mockReanimated = jest.requireMock('react-native-reanimated')

jest.mock('@sentry/react-native', () => {
  return {
    captureException: () => false,
    addBreadcrumb: () => {},
    wrap: x => x
  }
})

jest.mock('@react-native-clipboard/clipboard', () => mockClipboard)

jest.mock('disklet', () => {
  const originalModule = jest.requireActual('disklet')

  return {
    ...originalModule,
    makeReactNativeDisklet: () => ({
      setText: () => {},
      getText: () => {}
    })
  }
})

jest.mock('react-native-image-colors', () => ({
  getColors: jest.fn().mockResolvedValue('')
}))

jest.mock('react-native-keyboard-controller', () => {
  const height = mockReanimated.useSharedValue(0)
  const progress = mockReanimated.useSharedValue(0)
  return {
    useReanimatedKeyboardAnimation: () => ({
      height,
      progress
    }),
    useKeyboardHandler: handlers => {}
  }
})

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)

jest.mock('react-native-webview', () => ({
  WebView: () => {
    return null
  }
}))

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  isPad: false,
  isTVOS: false,
  isTV: false,
  constants: {
    osVersion: '17',
    reactNativeVersion: {
      major: 0,
      minor: 67
    }
  },
  select: obj => obj.ios ?? obj.default
}))

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 64
}))

jest.mock('rn-qr-generator', () => ({
  detect() {
    return Promise.resolve()
  }
}))

// force timezone to UTC
jest.mock('dateformat', () => (number, format) => require('dateformat')(number, format, true))

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
  },
  hasNotch() {
    return false
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
  show() {}
}))

jest.mock('react-native-fs', () => {
  // https://github.com/itinance/react-native-fs/issues/404
  return {
    mkdir() {},
    moveFile() {},
    copyFile() {},
    pathForBundle() {},
    pathForGroup() {},
    getFSInfo() {},
    getAllExternalFilesDirs() {},
    unlink() {},
    exists() {},
    stopDownload() {},
    resumeDownload() {},
    isResumable() {},
    stopUpload() {},
    completeHandlerIOS() {},
    readDir() {},
    readDirAssets() {},
    existsAssets() {},
    readdir() {},
    setReadable() {},
    stat() {},
    readFile() {},
    read() {},
    readFileAssets() {},
    hash() {},
    copyFileAssets() {},
    copyFileAssetsIOS() {},
    copyAssetsVideoIOS() {},
    writeFile() {},
    appendFile() {},
    write() {},
    downloadFile() {},
    uploadFiles() {},
    touch() {},
    MainBundlePath() {},
    CachesDirectoryPath() {},
    DocumentDirectoryPath() {},
    ExternalDirectoryPath() {},
    ExternalStorageDirectoryPath() {},
    TemporaryDirectoryPath() {},
    LibraryDirectoryPath() {},
    PicturesDirectoryPath() {}
  }
})

jest.mock('react-native-localize', () => ({
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
}))

jest.mock('react-native-permissions', () => require('react-native-permissions/mock'))

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

for (const log in global.console) {
  global.console[log] = jest.fn()
}

jest.mock('use-context-selector', () => {
  const contextValues = new Map()
  return {
    createContext: defaultValue => {
      // Create new provider
      const Provider = (props, context) => {
        contextValues.set(Provider, props.value)
        return props.children
      }
      // Get the value for the provider:
      const currentValue = contextValues.get(Provider)
      // Set it's default value:
      contextValues.set(Provider, currentValue ?? defaultValue)
      // Return provider
      return {
        Provider: Provider,
        displayName: 'test'
      }
    },
    useContextSelector: (context, selector) => {
      const currentValue = contextValues.get(context.Provider)
      const selected = selector(currentValue)
      return selected
    }
  }
})

jest.mock('react-native-device-info', () => {
  return {
    getDeviceType: jest.fn(),
    hasNotch: jest.fn(),
    getBuildNumber: jest.fn(),
    getVersion: jest.fn()
  }
})

jest.mock('react-native-reorderable-list', () => ({
  ...jest.requireActual('react-native-reorderable-list'),
  useReorderableDrag: () => jest.fn()
}))
