import { asDate } from 'cleaners'
import { PromoCard2 } from 'edge-info-server'
import * as React from 'react'
import { ListRenderItem, Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import shajs from 'sha.js'

import { getCountryCodeByIp, hideMessageTweak } from '../../actions/AccountReferralActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { infoServerData } from '../../util/network'
import { getOsVersion, zeroString } from '../../util/utils'
import { EdgeAnim, fadeInUp110 } from '../common/EdgeAnim'
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

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const [filteredCards, setFilteredCards] = React.useState<FilteredPromoCard[]>([])
  const [accountFunded, setAccountFunded] = React.useState<boolean>()
  const [countryCode, setCountryCode] = React.useState<string | undefined>()

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

  // Set countryCode once
  useAsyncEffect(
    async () => {
      const countryCode = await getCountryCodeByIp().catch(() => '')
      setCountryCode(countryCode)
    },
    [],
    'countryCode'
  )

  // Check for PromoCard2 from info server:
  React.useEffect(() => {
    if (countryCode == null) return
    const cards = infoServerData.rollup?.promoCards2 ?? []

    // We want to show cards even if balances aren't ready yet. We'll just
    // skip over balance-dependent cards until balances are ready
    setFilteredCards(filterPromoCards(cards, countryCode, accountFunded))
  }, [accountFunded, countryCode])

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
  const style = React.useMemo(() => ({ height: theme.rem(11.5) }), [theme])

  if (activeCards == null || activeCards.length === 0) return null
  return (
    <EdgeAnim style={style} enter={fadeInUp110}>
      <CarouselUi4 data={activeCards} keyExtractor={keyExtractor} renderItem={renderItem} height={theme.rem(9.75)} width={screenWidth} />
    </EdgeAnim>
  )
}

/**
 * Finds the promo cards that are relevant to our application version &
 * other factors.
 */
function filterPromoCards(cards: PromoCard2[], countryCode: string, accountFunded?: boolean): FilteredPromoCard[] {
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
      startIsoDate
    } = card
    const startDate = asDate(startIsoDate)
    const endDate = asDate(endIsoDate)

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
      dismissable,
      localeMessages,
      messageId
    })
  }

  return filteredCards
}
