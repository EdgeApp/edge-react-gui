import { asArray } from 'cleaners'
import { asInfoRollup, asPromoCard2, PromoCard2 } from 'edge-info-server/types'
import * as React from 'react'
import { Platform } from 'react-native'
import DeviceInfo, { getBuildNumber, getVersion } from 'react-native-device-info'

import { getCountryCodeByIp } from '../../actions/AccountReferralActions'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { config } from '../../theme/appConfig'
import { NavigationBase } from '../../types/routerTypes'
import { fetchInfo } from '../../util/network'
import { EdgeAnim } from '../common/EdgeAnim'
import { useTheme } from '../services/ThemeContext'
import { CarouselUi4 } from './CarouselUi4'
import { PromoCardUi4 } from './PromoCardUi4'

interface Props {
  navigation: NavigationBase
  screenWidth: number
}

export const PromoCardsUi4 = (props: Props) => {
  const { navigation, screenWidth } = props
  const theme = useTheme()

  const [promos, setPromos] = React.useState<PromoCard2[]>([])

  // Check for PromoCard2 from info server:
  React.useEffect(() => {
    const osType = Platform.OS.toLowerCase()
    const osVersion = DeviceInfo.getSystemVersion()
    const version = getVersion()

    fetchInfo(`v1/inforollup/${config.appId ?? 'edge'}?os=${osType}&osVersion=${osVersion}&appVersion=${version}`)
      .then(async res => {
        if (!res.ok) {
          console.error(await res.text())
          return
        }
        const infoData = await res.json()
        const infoPromoCards = asArray(asPromoCard2)(asInfoRollup(infoData).promoCards2)

        const buildNumber = getBuildNumber()
        const countryCode = await getCountryCodeByIp()
        const currentIsoDate = new Date().toISOString()

        setPromos(
          infoPromoCards.filter(infoPromoCard => {
            const { appVersion, minBuildNum, maxBuildNum, exactBuildNum, countryCodes, excludeCountryCodes, osTypes, osVersions, startIsoDate, endIsoDate } =
              infoPromoCard

            // Validate app version
            // Ignore everything else if build version is specified and mismatched.
            if (exactBuildNum != null && exactBuildNum !== buildNumber) return false

            // Ignore min/max if app version is specified and mismatched.
            if (appVersion != null && appVersion !== version) return false

            // Look at min/max only if exact build or app version is not specified.
            if (minBuildNum != null && minBuildNum > buildNumber) return false
            if (maxBuildNum != null && maxBuildNum < buildNumber) return false

            // Validate country
            const isCountryInclude =
              countryCodes == null ||
              countryCodes.length === 0 ||
              countryCodes.map(countryCode => countryCode.toLowerCase()).includes(countryCode.toLowerCase())
            const isCountryExclude =
              excludeCountryCodes != null &&
              excludeCountryCodes.length > 0 &&
              excludeCountryCodes.map(countryCode => countryCode.toLowerCase()).includes(countryCode.toLowerCase())
            if (!isCountryInclude || isCountryExclude) return false

            // Validate OS type
            if (osTypes != null && osTypes.length > 0 && !osTypes.map(osType => osType.toLowerCase()).includes(osType)) return false

            // Validate OS version
            if (osVersions != null && osVersions.length > 0 && !osVersions.includes(osVersion.toString())) return false

            // Validate date range
            // Ignore malformed date range
            if ((startIsoDate != null && isNaN(Date.parse(startIsoDate))) || (endIsoDate != null && isNaN(Date.parse(endIsoDate)))) {
              console.error(
                `PromoCards: Incorrect date ISO format. startIsoDate: ${startIsoDate}, endIsoDate: ${endIsoDate}. Ignoring date range filter and showing promo.`
              )
              return true
            }
            if (startIsoDate != null && currentIsoDate < startIsoDate) return false
            if (endIsoDate != null && currentIsoDate > endIsoDate) return false

            return true
          })
        )
      })
      .catch(e => console.log(String(e)))
  }, [])

  return promos == null || promos.length === 0 ? null : (
    <EdgeAnim style={{ height: theme.rem(11.5) }} enter={{ type: 'fadeInUp', distance: 110 }}>
      <CarouselUi4 height={theme.rem(9.75)} width={screenWidth}>
        {promos.map(promoInfo => (
          <PromoCardUi4 navigation={navigation} promoInfo={promoInfo} key={getLocaleOrDefaultString(promoInfo.localeMessages)} />
        ))}
      </CarouselUi4>
    </EdgeAnim>
  )
}
