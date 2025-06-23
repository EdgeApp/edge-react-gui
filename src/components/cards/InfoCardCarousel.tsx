import { InfoCard } from 'edge-info-server'
import * as React from 'react'
import { ListRenderItem, Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'

import { hideMessageTweak } from '../../actions/AccountReferralActions'
import { useAccountSettings } from '../../actions/LocalSettingsActions'
import { useHandler } from '../../hooks/useHandler'
import { useIsAccountFunded } from '../../hooks/useIsAccountFunded'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { DisplayInfoCard, getDisplayInfoCards } from '../../util/infoUtils'
import { addPromoCardToNotifications } from '../../util/promoCardUtils'
import { getOsVersion } from '../../util/utils'
import { Anim, EdgeAnim } from '../common/EdgeAnim'
import { EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { InfoCarouselCard } from './InfoCard'

interface Props {
  navigation: NavigationBase
  enterAnim: Anim
  screenWidth: number
  cards?: InfoCard[]
}

export const InfoCardCarousel = (props: Props) => {
  const { enterAnim, navigation, screenWidth, cards } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const accountReferral = useSelector(state => state.account.accountReferral)

  const countryCode = useSelector(state => state.ui.countryCode)

  const [filteredCards, setFilteredCards] = React.useState<DisplayInfoCard[]>(
    []
  )

  // Set account funded status
  const accountFunded = useIsAccountFunded()

  const { notifState } = useAccountSettings()

  // Check for PromoCard2 from info server:
  React.useEffect(() => {
    if (cards == null) return
    // We want to show cards even if balances aren't ready yet. We'll just
    // skip over balance-dependent cards until balances are ready
    const currentDate = new Date()
    const buildNumber = getBuildNumber()
    const osType = Platform.OS.toLowerCase()
    const version = getVersion()
    const osVersion = getOsVersion()

    const referralPromotions = accountReferral.promotions ?? []
    const promoIds = [
      ...referralPromotions.map(promotion => promotion.installerId),
      ...(accountReferral.activePromotions ?? [])
    ]
    setFilteredCards(
      getDisplayInfoCards({
        cards,
        countryCode,
        accountFunded,
        promoIds,
        buildNumber,
        osType,
        osVersion,
        version,
        currentDate
      })
    )
  }, [accountFunded, accountReferral, cards, countryCode])

  const account = useSelector(state => state.core.account)
  const hiddenAccountMessages = useSelector(
    state => state.account.accountReferral.hiddenAccountMessages
  )
  const activeCards = React.useMemo(
    () => filteredCards.filter(card => !hiddenAccountMessages[card.messageId]),
    [filteredCards, hiddenAccountMessages]
  )

  // List rendering methods:
  const keyExtractor = useHandler((item: DisplayInfoCard) => item.messageId)
  const renderItem: ListRenderItem<DisplayInfoCard> = useHandler(({ item }) => {
    const handleClose = async (): Promise<void> => {
      // Hide the message from the home screen
      await dispatch(hideMessageTweak(item.messageId, { type: 'account' }))

      // Only add the notification if we've never saved it before
      if (notifState[item.messageId] == null) {
        try {
          // Add to notification center
          // addPromoCardToNotifications has its own validation checks
          await addPromoCardToNotifications(account, item)
        } catch (error) {
          console.error(
            'Failed to add promo card to notification center:',
            error
          )
        }
      }
    }
    return (
      <InfoCarouselCard
        navigation={navigation}
        promoInfo={item}
        onClose={handleClose}
      />
    )
  })

  if (activeCards == null || activeCards.length === 0) return null
  return (
    <EdgeAnim enter={enterAnim}>
      <EdgeCarousel
        data={activeCards}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        height={theme.rem(10)}
        width={screenWidth}
      />
    </EdgeAnim>
  )
}
