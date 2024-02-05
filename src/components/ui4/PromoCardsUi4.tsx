import { asArray, asDate } from 'cleaners'
import { asInfoRollup, asPromoCard2, PromoCard2 } from 'edge-info-server/types'
import * as React from 'react'
import { ListRenderItem, Platform } from 'react-native'
import DeviceInfo, { getBuildNumber, getVersion } from 'react-native-device-info'
import shajs from 'sha.js'

import { getCountryCodeByIp, hideMessageTweak } from '../../actions/AccountReferralActions'
import { useHandler } from '../../hooks/useHandler'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { fetchInfo } from '../../util/network'
import { EdgeAnim } from '../common/EdgeAnim'
import { useTheme } from '../services/ThemeContext'
import { CarouselUi4 } from './CarouselUi4'
import { FilteredPromoCard, PromoCardUi4 } from './PromoCardUi4'

interface Props {
  navigation: NavigationBase
  screenWidth: number
}

export const PromoCardsUi4 = (props: Props) => {
  const { navigation, screenWidth } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const [cards, setCards] = React.useState<FilteredPromoCard[]>([])

  // Check for PromoCard2 from info server:
  React.useEffect(() => {
    fetchPromoCards()
      .then(async cards => {
        const countryCode = await getCountryCodeByIp()
        const filteredCards = filterPromoCards(cards, countryCode)
        setCards(filteredCards)
      })
      .catch(e => console.log(e))
  }, [])

  const hiddenAccountMessages = useSelector(state => state.account.accountReferral.hiddenAccountMessages)
  const activeCards = React.useMemo(() => cards.filter(card => !hiddenAccountMessages[card.messageId]), [cards, hiddenAccountMessages])

  // List rendering methods:
  const keyExtractor = useHandler((item: FilteredPromoCard) => item.messageId)
  const renderItem: ListRenderItem<FilteredPromoCard> = useHandler(({ item }) => {
    const handleClose = async (): Promise<void> => {
      await dispatch(hideMessageTweak(item.messageId, { type: 'account' }))
    }
    return <PromoCardUi4 navigation={navigation} promoInfo={item} onClose={handleClose} />
  })

  if (activeCards == null || activeCards.length === 0) return null

  return (
    <EdgeAnim style={{ height: theme.rem(11.5) }} enter={{ type: 'fadeInUp', distance: 110 }}>
      <CarouselUi4 data={activeCards} keyExtractor={keyExtractor} renderItem={renderItem} height={theme.rem(9.75)} width={screenWidth} />
    </EdgeAnim>
  )
}

/**
 * Reads and normalizes the OS version.
 */
function getOsVersion(): string {
  const osVersionRaw = DeviceInfo.getSystemVersion()
  return Array.from({ length: 3 }, (_, i) => osVersionRaw.split('.')[i] || '0').join('.')
}

/**
 * Visits the info server to obtain relevant promotion cards.
 */
async function fetchPromoCards(): Promise<PromoCard2[]> {
  const osType = Platform.OS.toLowerCase()
  const osVersion = getOsVersion()
  const version = getVersion()

  // Visit the server:
  const res = await fetchInfo(`v1/inforollup/${config.appId ?? 'edge'}?os=${osType}&osVersion=${osVersion}&appVersion=${version}`)
  if (!res.ok) {
    throw new Error(`Info server error ${res.status}: ${await res.text()}`)
  }
  const infoData = await res.json()
  return asArray(asPromoCard2)(asInfoRollup(infoData).promoCards2)
}

/**
 * Finds the promo cards that are relevant to our application version &
 * other factors.
 */
function filterPromoCards(cards: PromoCard2[], countryCode: string): FilteredPromoCard[] {
  const buildNumber = getBuildNumber()
  const currentDate = new Date()
  const osType = Platform.OS.toLowerCase()
  const version = getVersion()
  const osVersion = getOsVersion()
  countryCode = countryCode.toLowerCase()

  // Find relevant cards:
  const filteredCards: FilteredPromoCard[] = []
  for (const card of cards) {
    const {
      appVersion,
      background,
      countryCodes = [],
      ctaButton,
      endIsoDate,
      exactBuildNum,
      excludeCountryCodes = [],
      localeMessages,
      maxBuildNum,
      minBuildNum,
      osTypes = [],
      osVersions = [],
      startIsoDate
    } = card
    const startDate = asDate(startIsoDate)
    const endDate = asDate(endIsoDate)

    // Validate app version
    // Ignore everything else if build version is specified and mismatched.
    if (exactBuildNum != null && exactBuildNum !== buildNumber) continue

    // Ignore min/max if app version is specified and mismatched.
    if (appVersion != null && appVersion !== version) continue

    // Look at min/max only if exact build or app version is not specified.
    if (minBuildNum != null && minBuildNum > buildNumber) continue
    if (maxBuildNum != null && maxBuildNum < buildNumber) continue

    // Validate country
    const isCountryInclude = countryCodes.length === 0 || countryCodes.map(countryCode => countryCode.toLowerCase()).includes(countryCode)
    const isCountryExclude = excludeCountryCodes.length > 0 && excludeCountryCodes.map(countryCode => countryCode.toLowerCase()).includes(countryCode)
    if (!isCountryInclude || isCountryExclude) continue

    // Validate OS type
    if (osTypes.length > 0 && !osTypes.map(osType => osType).includes(osType)) continue

    // Validate OS version
    if (osVersions.length > 0 && !osVersions.includes(osVersion)) continue

    // Validate date range
    if (startIsoDate != null && currentDate.valueOf() < startDate.valueOf()) continue
    if (endIsoDate != null && currentDate.valueOf() > endDate.valueOf()) continue

    const messageId = shajs('sha256')
      .update(localeMessages.en_US ?? JSON.stringify(card), 'utf8')
      .digest('base64')

    filteredCards.push({
      background,
      ctaButton,
      localeMessages,
      messageId
    })
  }

  return filteredCards
}
