import './node_modules/react-native-gesture-handler/jestSetup.js'

import { jest } from '@jest/globals'
import mockClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock.js'
import mockPermissions from 'react-native-permissions/mock'
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'

// --------------------------------------------------------------------
// Officially-supported mocks
// --------------------------------------------------------------------

jest.mock('@react-native-clipboard/clipboard', () => mockClipboard)
jest.mock('react-native-permissions', () => mockPermissions)
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)
require('react-native-reanimated').setUpTests()

// --------------------------------------------------------------------
// Environment hacks
// --------------------------------------------------------------------

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

for (const log in global.console) {
  global.console[log] = jest.fn()
}

// Force timezone to UTC:
jest.mock(
  'dateformat',
  () => (number, format) => require('dateformat')(number, format, true)
)

jest.useFakeTimers()

// --------------------------------------------------------------------
// Manually-created mocks
// --------------------------------------------------------------------

jest.mock('@sentry/react-native', () => {
  return {
    captureException: () => false,
    addBreadcrumb: () => {},
    wrap: x => x
  }
})

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

jest.mock('expo-image', () => {
  const { Image } = require('react-native')
  return { Image }
})

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native')
  return { LinearGradient: View }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}))

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' })
}))

jest.mock('expo-localization', () => ({
  getLocales() {
    return [
      {
        languageTag: 'en-US',
        languageCode: 'en',
        regionCode: 'US',
        currencyCode: 'USD',
        decimalSeparator: '.',
        digitGroupingSeparator: ','
      }
    ]
  }
}))

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.2.3',
  nativeBuildVersion: '2019010101'
}))

jest.mock('expo-device', () => ({
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4
  },
  brand: 'Apple',
  modelId: 'iPhone7,2',
  modelName: 'iPhone 7',
  productName: null,
  osVersion: '17.0.0',
  deviceType: 1
}))

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'WIFI'
  }),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() }))
}))

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000000')
}))

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true)
}))

jest.mock('expo-battery', () => ({
  useLowPowerMode: () => false,
  usePowerState: () => ({
    batteryLevel: 1,
    batteryState: 1,
    lowPowerMode: false
  })
}))

jest.mock('expo-mail-composer', () => ({
  composeAsync: jest.fn().mockResolvedValue({ status: 'sent' }),
  isAvailableAsync: jest.fn().mockResolvedValue(true)
}))

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: null
  })
}))

jest.mock('expo-contacts', () => ({
  Fields: {
    Name: 'name',
    FirstName: 'firstName',
    LastName: 'lastName',
    Company: 'company',
    Image: 'image',
    ImageAvailable: 'imageAvailable'
  },
  getContactsAsync: jest.fn().mockResolvedValue({
    data: [],
    hasNextPage: false,
    hasPreviousPage: false
  })
}))

jest.mock('expo-av', () => {
  const sound = {
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    playAsync: jest.fn().mockResolvedValue({ isLoaded: true })
  }
  return {
    InterruptionModeIOS: {
      MixWithOthers: 0,
      DoNotMix: 1,
      DuckOthers: 2
    },
    Audio: {
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      Sound: {
        createAsync: jest.fn().mockResolvedValue({ sound })
      }
    }
  }
})

jest.mock('react-native-keyboard-controller', () => ({
  useReanimatedKeyboardAnimation: () => ({
    height: { value: 0 },
    progress: { value: 0 }
  }),
  useKeyboardHandler: handlers => {},
  KeyboardAwareScrollView: require('react-native').ScrollView
}))

jest.mock('react-native-webview', () => ({
  WebView: () => {
    return null
  }
}))

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 64
}))

jest.mock('rn-qr-generator', () => ({
  detect() {
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

jest.mock('react-native-vision-camera', () => ({}))

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
      {
        countryCode: 'US',
        languageTag: 'en-US',
        languageCode: 'en',
        isRTL: false
      },
      {
        countryCode: 'FR',
        languageTag: 'fr-FR',
        languageCode: 'fr',
        isRTL: false
      }
    ]
  },
  getNumberFormatSettings() {
    return {
      decimalSeparator: '.',
      groupingSeparator: ','
    }
  }
}))

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
        Provider,
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
