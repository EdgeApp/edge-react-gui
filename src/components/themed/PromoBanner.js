// @flow

import * as React from 'react'
import { Linking } from 'react-native'
import Carousel from 'react-native-reanimated-carousel'

import { hideMessageTweak } from '../../actions/AccountReferralActions.js'
import { linkReferralWithCurrencies } from '../../actions/WalletListActions.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useWindowSize } from '../../hooks/useWindowSize.js'
import { useCallback, useEffect, useMemo, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type AppFlags, type Promotion, getProfile, getPromotions, hasWyreLinkedBank, testProfile } from '../../util/promoHelpers.js'
import { bestOfMessages } from '../../util/ReferralHelpers.js'
import { PromoCard } from '../cards/PromoCard.js'
import { useTheme } from '../services/ThemeContext.js'

const dummyPromos = [
  {
    messageId: '12345',
    message: {
      'en-US': {
        title: 'hello',
        body: 'BCH',
        imageUrl: 'https://content.edge.app/currencyIcons/bitcoincash/bitcoincash.png'
      }
    },
    locations: {
      US: true
    },
    appFlags: {
      wyreLinkedBank: true
    },
    appId: 'edge',
    forPlatform: 'ios',
    maxVersion: '7'
  },
  {
    messageId: '12345',
    message: {
      'en-US': {
        title: 'hello',
        body: 'BTC',
        imageUrl: 'https://content.edge.app/currencyIcons/bitcoin/bitcoin.png'
      }
    },
    locations: {
      US: true
    },
    appFlags: {
      wyreLinkedBank: true
    },
    appId: 'edge',
    forPlatform: 'ios',
    maxVersion: '7'
  },
  {
    messageId: '12345',
    message: {
      'en-US': {
        title: 'hello',
        body: 'ETH',
        imageUrl: 'https://content.edge.app/currencyIcons/ethereum/ethereum.png'
      }
    },
    locations: {
      US: true
    },
    appFlags: {
      wyreLinkedBank: true
    },
    appId: 'edge',
    forPlatform: 'ios',
    maxVersion: '7'
  },
  {
    messageId: '12345',
    message: {
      'en-US': {
        title: 'hello',
        body: 'DOGE',
        imageUrl: 'https://content.edge.app/currencyIcons/dogecoin/dogecoin.png'
      }
    },
    locations: {
      US: true
    },
    appFlags: {
      wyreLinkedBank: true
    },
    appId: 'edge',
    forPlatform: 'ios',
    maxVersion: '7'
  }
]

export const PromoBanner = () => {
  const dispatch = useDispatch()

  const accountMessages = useSelector(state => state.account.referralCache.accountMessages)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const store = useSelector(state => state.core.account.dataStore)
  const theme = useTheme()

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [localFlags, setLocalFlags] = useState<AppFlags>({})
  const { width } = useWindowSize()

  // Define user profile
  const profile = useMemo(() => getProfile(), [])
  console.log('28. profile', profile)

  // Get active promotions
  useAsyncEffect(async () => {
    const promos = await getPromotions()
    setPromotions(promos)
  })

  // Test for wyreLinkedBank
  useEffect(() => {
    if (localFlags.wyreLinkedBank != null) return
    // let abort = false
    // hasWyreLinkedBank(store).then(bool => {
    //   if (abort) return
    setLocalFlags({ ...localFlags, wyreLinkedBank: true })
    // })
  }, [localFlags])

  // Promo card actions
  const promoCardOnPress = useCallback<(uri: string | void) => void>(uri => {
    if (uri != null) Linking.openURL(uri)
  }, [])
  const promoCardOnClose = useCallback<(id: string) => void>(
    id => {
      setPromotions(promotions.filter(promo => promo.messageId !== id))
    },
    [promotions]
  )

  // Look for active referral promotion
  const referralPromoCard = useMemo(() => {
    const messageSummary = bestOfMessages(accountMessages, accountReferral)
    if (messageSummary == null) return null
    const {
      message: { message, iconUri, uri },
      messageId,
      messageSource
    } = messageSummary

    const referralOnPress = () => {
      if (uri != null) dispatch(linkReferralWithCurrencies(uri))
    }
    const referralOnClose = () => {
      dispatch(hideMessageTweak(messageId, messageSource))
    }

    return { message, iconUri, onPress: referralOnPress, onClose: referralOnClose }
  }, [accountMessages, accountReferral, dispatch])

  // Gather cards
  const promoCards = useMemo(
    () =>
      promotions
        .concat(dummyPromos)
        .filter(promo => Object.keys(promo.appFlags).every(flag => localFlags[flag] === true))
        .filter(promo => promo.message[profile.language] != null)
        .map(promo => {
          const { imageUrl, body } = promo.message[profile.language]
          return { message: body, iconUri: imageUrl, onPress: () => promoCardOnPress('https://www.edge.app'), onClose: () => promoCardOnClose(promo.messageId) } // TODO: replace website with actual url
        }),
    [localFlags, profile, promoCardOnClose, promoCardOnPress, promotions]
  )
  if (referralPromoCard != null) promoCards.push(referralPromoCard)

  // Render
  if (promoCards.length === 0) return null

  // Disable spin and preview if there's only one card to display
  const enabled = promoCards.length !== 1
  const autoFillData = promoCards.length !== 1
  const modeConfig = {
    parallaxScrollingScale: 0.8,
    parallaxAdjacentItemScale: 0.65,
    parallaxScrollingOffset: width / 4.5
  }

  return (
    <Carousel
      autoPlay={false}
      modeConfig={modeConfig}
      enabled={enabled}
      scrollAnimationDuration={2000}
      autoFillData={autoFillData}
      mode="parallax"
      width={width}
      height={theme.rem(6.75)}
      data={promoCards}
      renderItem={({ item, index, animationValue }) => (
        <PromoCard animationValue={animationValue} message={item.message} iconUri={item.iconUri} onPress={item.onPress} onClose={item.onClose} />
      )}
    />
  )
}
