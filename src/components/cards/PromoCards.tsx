import { asDate } from 'cleaners'
import { PromoCard2 } from 'edge-info-server'
import * as React from 'react'
import { ListRenderItem, Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import shajs from 'sha.js'

import { hideMessageTweak } from '../../actions/AccountReferralActions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { NavigationBase } from '../../types/routerTypes'
import { infoServerData } from '../../util/network'
import { getOsVersion, zeroString } from '../../util/utils'
import { EdgeAnim, fadeInUp110 } from '../common/EdgeAnim'
import { EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { FilteredPromoCard, PromoCardUi4 } from './PromoCard'

interface Props {
  navigation: NavigationBase
  screenWidth: number
  countryCode?: string
}

export const PromoCardsUi4 = (props: Props) => {
  const { countryCode, navigation, screenWidth } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const accountReferral = useSelector(state => state.account.accountReferral)

  const currencyWallets = useWatch(account, 'currencyWallets')

  const [filteredCards, setFilteredCards] = React.useState<FilteredPromoCard[]>([])
  const [accountFunded, setAccountFunded] = React.useState<boolean>()

  const walletsSynced = useSelector(state => {
    const { currencyWallets } = state.core.account
    const { userPausedWalletsSet } = state.ui.settings
    const unPausedWallets = Object.values(currencyWallets).filter(wallet => !userPausedWalletsSet?.has(wallet.id))
    const unSyncedWallets = unPausedWallets.filter(wallet => wallet.syncRatio < 1)

    return unSyncedWallets.length === 0
  })

  // Set account funded status
  React.useEffect(() => {
    if (!walletsSynced) return
    setAccountFunded(Object.values(currencyWallets).some(wallet => [...wallet.balanceMap.values()].some(balanceVal => !zeroString(balanceVal))))
  }, [currencyWallets, walletsSynced])

  // Check for PromoCard2 from info server:
  React.useEffect(() => {
    const cards = infoServerData.rollup?.promoCards2 ?? []

    // We want to show cards even if balances aren't ready yet. We'll just
    // skip over balance-dependent cards until balances are ready
    const currentDate = new Date()
    const buildNumber = getBuildNumber()
    const osType = Platform.OS.toLowerCase()
    const version = getVersion()
    const osVersion = getOsVersion()

    setFilteredCards(
      filterPromoCards({
        cards,
        countryCode,
        accountFunded,
        accountReferral,
        buildNumber,
        osType,
        osVersion,
        version,
        currentDate
      })
    )
  }, [accountFunded, accountReferral, countryCode])

  const hiddenAccountMessages = useSelector(state => state.account.accountReferral.hiddenAccountMessages)
  const activeCards = React.useMemo(() => filteredCards.filter(card => !hiddenAccountMessages[card.messageId]), [filteredCards, hiddenAccountMessages])

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
    <EdgeAnim enter={fadeInUp110}>
      <EdgeCarousel data={activeCards} keyExtractor={keyExtractor} renderItem={renderItem} height={theme.rem(10)} width={screenWidth} />
    </EdgeAnim>
  )
}

/**
 * Finds the promo cards that are relevant to our application version &
 * other factors.
 */
export function filterPromoCards(params: {
  cards: PromoCard2[]
  countryCode?: string
  buildNumber: string
  osType: string
  version: string
  osVersion: string
  currentDate: Date
  accountFunded?: boolean
  accountReferral?: Partial<AccountReferral>
}): FilteredPromoCard[] {
  const { cards, countryCode, accountFunded, buildNumber, osType, version, osVersion, currentDate, accountReferral } = params

  let accountPromoIds: string[] | undefined
  if (accountReferral != null) {
    const accountReferralId = accountReferral?.installerId == null ? [] : [accountReferral.installerId]
    const promotions = accountReferral.promotions ?? []
    accountPromoIds = [...promotions.map(promotion => promotion.installerId), ...accountReferralId]
  }

  // Find relevant cards:
  const ccLowerCase = countryCode?.toLowerCase()
  const filteredCards: FilteredPromoCard[] = []
  for (const card of cards) {
    const {
      appVersion,
      background,
      countryCodes = [],
      ctaButton,
      dismissable = false,
      endIsoDate,
      exactBuildNum,
      excludeCountryCodes = [],
      localeMessages,
      maxBuildNum,
      minBuildNum,
      noBalance = false,
      osTypes = [],
      osVersions = [],
      startIsoDate,
      pluginPromotions,
      promoId
    } = card

    const startDate = asDate(startIsoDate ?? '1970-01-01')
    const endDate = asDate(endIsoDate ?? '1970-01-01')

    // Validate balance status. If the card specifies 'noBalance' and
    // accountFunded balances are not ready yet (undefined), omit until balances
    // are ready and we re-run.
    if (noBalance) {
      if (accountFunded == null || accountFunded) continue
    }

    // Validate app version
    // Ignore everything else if build version is specified and mismatched.
    if (exactBuildNum != null && exactBuildNum !== buildNumber) continue

    // Ignore min/max if app version is specified and mismatched.
    if (appVersion != null && appVersion !== version) continue

    // Look at min/max only if exact build or app version is not specified.
    if (minBuildNum != null && minBuildNum > buildNumber) continue
    if (maxBuildNum != null && maxBuildNum < buildNumber) continue

    // Validate country
    if (excludeCountryCodes.length > 0 || countryCodes.length > 0) {
      if (ccLowerCase == null) continue
      const isCountryInclude = countryCodes.length === 0 || countryCodes.map(cc => cc.toLowerCase()).includes(ccLowerCase)
      const isCountryExclude = excludeCountryCodes.length > 0 && excludeCountryCodes.map(cc => cc.toLowerCase()).includes(ccLowerCase)
      if (!isCountryInclude || isCountryExclude) continue
    }

    // Validate OS type
    if (osTypes.length > 0 && !osTypes.map(osType => osType).includes(osType)) continue

    // Validate OS version
    if (osVersions.length > 0 && !osVersions.includes(osVersion)) continue

    // Validate date range
    if (startIsoDate != null && currentDate.valueOf() < startDate.valueOf()) continue
    if (endIsoDate != null && currentDate.valueOf() > endDate.valueOf()) continue

    // Validate promoId
    if (promoId != null && (accountPromoIds == null || !accountPromoIds.some(accountPromoId => accountPromoId === promoId))) continue

    const messageId = shajs('sha256')
      .update(localeMessages.en_US ?? JSON.stringify(card), 'utf8')
      .digest('base64')

    filteredCards.push({
      background,
      ctaButton,
      dismissable,
      localeMessages,
      pluginPromotions,
      messageId
    })
  }

  return filteredCards
}
