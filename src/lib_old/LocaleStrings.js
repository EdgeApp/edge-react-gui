import defaultLang from '../locales/default'
import enPH from '../locales/en_PH'
const supportedLocales = {
  en_PH: enPH
}

// HEY YOU! just import and then add your locales to the supportedLocales array
// PROBABLY DO NOT CHANGE ANYTHING BELOW THIS LINE
import DeviceInfo from 'react-native-device-info'
const deviceLocale = DeviceInfo.getDeviceLocale()

const LocaleStrings = function (inputKey, reqLocale) {
  // if no locale specified, use device
  if (!reqLocale) {
    reqLocale = deviceLocale
  }
  const localeFormatted = reqLocale.replace('-', '_') // in iOS, locales are - so we standardize to android

  let localeStrings = defaultLang
  if (supportedLocales[localeFormatted]) {
    localeStrings = supportedLocales[localeFormatted]
  }

  if (localeStrings[inputKey] !== undefined) {
    return localeStrings[inputKey]
  } else if (defaultLang[inputKey] !== undefined) {
    return defaultLang[inputKey]
  } else {
    return '???-' + inputKey + '-???'
  }
}

export default LocaleStrings
