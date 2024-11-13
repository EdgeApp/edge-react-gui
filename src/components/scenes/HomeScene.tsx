import { ContentPost } from 'edge-info-server'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { config } from '../../theme/appConfig'
import { EdgeTabsSceneProps, NavigationBase } from '../../types/routerTypes'
import { getUi4ImageUri } from '../../util/CdnUris'
import { infoServerData } from '../../util/network'
import { BalanceCard } from '../cards/BalanceCard'
import { ContentPostCarousel } from '../cards/ContentPostCarousel'
import { HomeTileCard } from '../cards/HomeTileCard'
import { InfoCardCarousel } from '../cards/InfoCardCarousel'
import { MarketsCard } from '../cards/MarketsCard'
import { SupportCard } from '../cards/SupportCard'
import { EdgeAnim, fadeInUp30, fadeInUp60, fadeInUp80, fadeInUp110, fadeInUp140 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SectionView } from '../layout/SectionView'
import { AccountSyncBar } from '../progress-indicators/AccountSyncBar'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props extends EdgeTabsSceneProps<'home'> {}

const TEMP_PADDING_REM = 0.5 // To be built-in to SceneWrapper when fully UI4

/**
 * Filters a list of ContentPosts based on the provided country code.
 *
 * @param contentPosts - An array of `ContentPost` objects representing the
 * content posts to filter.
 * @param countryCode - An optional string representing the country code to filter by. If `null`, an empty array is returned.
 * @returns An array of `ContentPost` objects that match the provided country code.
 */
export const filterContentPosts = (contentPosts?: ContentPost[], countryCode?: string): ContentPost[] => {
  if (contentPosts == null) return []
  return contentPosts.filter((contentPost: ContentPost) => {
    const { countryCodes: includeCountryCodes = [], excludeCountryCodes = [] } = contentPost

    const isCountryInclude =
      includeCountryCodes.length === 0 ||
      (countryCode != null && includeCountryCodes.some(includeCountryCode => includeCountryCode.toUpperCase() === countryCode.toUpperCase()))
    const isCountryExclude =
      excludeCountryCodes.length > 0 &&
      (countryCode == null || excludeCountryCodes.some(excludeCountryCode => excludeCountryCode.toUpperCase() === countryCode.toUpperCase()))

    return isCountryInclude && !isCountryExclude
  })
}

export const HomeScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { width: screenWidth } = useSafeAreaFrame()

  // Evenly distribute the home cards into 4 quadrants:
  const cardSize = screenWidth / 2 - theme.rem(TEMP_PADDING_REM)

  const [countryCode, setCountryCode] = React.useState<string | undefined>()
  const [blogPosts, setBlogPosts] = React.useState<ContentPost[]>([])
  const [videoPosts, setVideoPosts] = React.useState<ContentPost[]>([])

  //
  // Handlers
  //

  const handleBuyPress = useHandler(() => {
    navigation.navigate('buyTab')
  })
  const handleSellPress = useHandler(() => {
    navigation.navigate('sellTab')
  })
  const handleFioPress = useHandler(() => {
    navigation.navigate('earnScene', {})
  })
  const handleSwapPress = useHandler(() => {
    navigation.navigate('swapTab')
  })
  const handleViewAssetsPress = useHandler(() => {
    navigation.navigate('edgeTabs', { screen: 'walletsTab', params: { screen: 'walletList' } })
  })
  const handleScroll = useSceneScrollHandler()

  // Set countryCode once
  useAsyncEffect(
    async () => {
      const { countryCode } = await getFirstOpenInfo()
      setCountryCode(countryCode)
    },
    [],
    'countryCode'
  )

  // Check for content posts from info server:
  React.useEffect(() => {
    // Merge legacy non-geographic-specific blog posts with geo-specific ones:
    const nonGeoPosts = (infoServerData.rollup?.blogPosts ?? []).map(legacyBlogPost => ({
      countryCodes: [],
      excludeCountryCodes: [],
      ...legacyBlogPost
    }))
    setBlogPosts([...nonGeoPosts, ...filterContentPosts(infoServerData.rollup?.blogPostsGeo, countryCode)])

    // Get video posts
    setVideoPosts(filterContentPosts(infoServerData.rollup?.videoPosts, countryCode))
  }, [countryCode])

  const buyCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-buy-crypto') }), [theme])
  const sellCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-sell-crypto') }), [theme])
  const earnIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-earn') }), [theme])
  const tradeCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-trade') }), [theme])
  const homeRowStyle = React.useMemo(() => [styles.homeRowContainer, { height: cardSize }], [styles, cardSize])
  const hideFio = ENV.FIO_INIT == null || ENV.FIO_INIT === false
  const hideSwap = config.disableSwaps === true

  return (
    <SceneWrapper hasNotifications hasTabs>
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <AccountSyncBar />
          <Animated.ScrollView
            onScroll={handleScroll}
            style={undoInsetStyle}
            contentContainerStyle={[{ ...insetStyle, paddingBottom: insetStyle.paddingBottom }]}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          >
            <SectionView extendRight marginRem={TEMP_PADDING_REM}>
              <>
                <EdgeAnim enter={fadeInUp140}>
                  <BalanceCard onViewAssetsPress={handleViewAssetsPress} navigation={navigation as NavigationBase} />
                </EdgeAnim>
                {/* Animation inside PromoCardsUi4 component */}
                <InfoCardCarousel
                  enterAnim={fadeInUp110}
                  cards={infoServerData.rollup?.promoCards2}
                  countryCode={countryCode}
                  navigation={navigation as NavigationBase}
                  screenWidth={screenWidth}
                />
                <EdgeAnim style={homeRowStyle} enter={fadeInUp80}>
                  <HomeTileCard
                    title={lstrings.buy_crypto}
                    footer={lstrings.buy_crypto_footer}
                    gradientBackground={theme.buyCardGradient}
                    nodeBackground={
                      <View style={styles.backroundImageContainer}>
                        <FastImage source={buyCryptoIcon} style={styles.backgroundImage} resizeMode="stretch" />
                      </View>
                    }
                    onPress={handleBuyPress}
                  />
                  <HomeTileCard
                    title={lstrings.sell_crypto}
                    footer={lstrings.sell_crypto_footer}
                    gradientBackground={theme.sellCardGradient}
                    nodeBackground={
                      <View style={styles.backroundImageContainer}>
                        <FastImage source={sellCryptoIcon} style={styles.backgroundImage} resizeMode="stretch" />
                      </View>
                    }
                    onPress={handleSellPress}
                  />
                </EdgeAnim>
                {!hideFio || !hideSwap ? (
                  <EdgeAnim style={homeRowStyle} enter={fadeInUp60}>
                    {hideFio ? null : (
                      <HomeTileCard
                        title={lstrings.staking_earn_crypto}
                        footer={lstrings.staking_earn_crypto_footer}
                        gradientBackground={theme.earnCardGradient}
                        nodeBackground={
                          <View style={styles.backroundImageContainer}>
                            <FastImage source={earnIcon} style={styles.backgroundImage} resizeMode="stretch" />
                          </View>
                        }
                        onPress={handleFioPress}
                      />
                    )}
                    {hideSwap ? null : (
                      <HomeTileCard
                        title={lstrings.swap_crypto}
                        footer={lstrings.swap_crypto_footer}
                        gradientBackground={theme.swapCardGradient}
                        nodeBackground={
                          <View style={styles.backroundImageContainer}>
                            <FastImage source={tradeCryptoIcon} style={styles.backgroundImage} resizeMode="stretch" />
                          </View>
                        }
                        onPress={handleSwapPress}
                      />
                    )}
                  </EdgeAnim>
                ) : null}
              </>
              {blogPosts == null || blogPosts.length === 0 ? null : (
                <>
                  <SectionHeader leftTitle={lstrings.edgeucation_articles} />
                  <ContentPostCarousel contentPosts={blogPosts} />
                </>
              )}
              <>
                <SectionHeader
                  leftTitle={lstrings.title_markets}
                  rightNode={lstrings.see_all}
                  onRightPress={() => navigation.navigate('edgeAppStack', { screen: 'coinRanking' })}
                />
                <EdgeAnim enter={fadeInUp30}>
                  <MarketsCard navigation={navigation as NavigationBase} numRows={5} />
                </EdgeAnim>
              </>
              {videoPosts == null || videoPosts.length === 0 ? null : (
                <>
                  <SectionHeader leftTitle={lstrings.edgeucation_videos} />
                  <ContentPostCarousel contentPosts={videoPosts} />
                </>
              )}
              <SupportCard title={lstrings.title_support} body={lstrings.body_support} buttonText={lstrings.button_support} url={config.supportContactSite} />
            </SectionView>
          </Animated.ScrollView>
        </>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  backroundImageContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    opacity: 0.6
  },
  backgroundImage: {
    aspectRatio: 1,
    width: '100%'
  },
  homeRowContainer: {
    flexDirection: 'row',
    // flexGrow: 1,
    justifyContent: 'space-evenly',
    alignContent: 'center',
    alignItems: 'stretch'
  }
}))
