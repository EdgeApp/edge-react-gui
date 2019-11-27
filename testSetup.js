/* eslint-disable flowtype/require-valid-file-annotation */

import dateformat from 'dateformat'

/* globals jest */
jest.mock('dateformat', () => (number, format) => dateformat(number, format, true)) // force timezone to UTC
jest.mock('react-native-device-info', () => ({
  getBuildNumber () {
    return '2019010101'
  },
  getDeviceLocale () {
    return 'en_US'
  },
  getVersion () {
    return '1.2.3'
  },
  isTablet () {
    return false
  }
}))
jest.mock('react-native-firebase', () => ({ isMock: true }))
jest.mock('react-native-share', () => 'RNShare')
jest.mock(
  'react-native-sound',
  () =>
    class Sound {
      static setCategory () {}
      play () {}
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
jest.mock('Linking', () => {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn()
  }
})
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
