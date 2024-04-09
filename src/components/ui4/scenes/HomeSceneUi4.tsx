import { asBlogPosts, BlogPost } from 'edge-info-server'
import * as React from 'react'
import { ListRenderItem, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useSceneScrollHandler } from '../../../state/SceneScrollState'
import { config } from '../../../theme/appConfig'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getUi4ImageUri } from '../../../util/CdnUris'
import { fetchInfo } from '../../../util/network'
import { EdgeAnim, fadeInUp30, fadeInUp60, fadeInUp80, fadeInUp140 } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { WiredProgressBar } from '../../themed/WiredProgressBar'
import { BalanceCardUi4 } from '../BalanceCardUi4'
import { BlogCard } from '../BlogCard'
import { CarouselUi4 } from '../CarouselUi4'
import { HomeCardUi4 } from '../HomeCardUi4'
import { MarketsCardUi4 } from '../MarketsCardUi4'
import { PromoCardsUi4 } from '../PromoCardsUi4'
import { SectionHeaderUi4 } from '../SectionHeaderUi4'
import { SectionView } from '../SectionView'
import { SupportCardUi4 } from '../SupportCardUi4'

interface Props extends EdgeSceneProps<'home'> {}

const TEMP_PADDING_REM = 0.5 // To be built-in to SceneWrapper when fully UI4

export const HomeSceneUi4 = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { width: screenWidth } = useSafeAreaFrame()

  // Evenly distribute the home cards into 4 quadrants:
  const cardSize = screenWidth / 2 - theme.rem(TEMP_PADDING_REM)

  //
  // Handlers
  //

  const handleBuyPress = useHandler(() => {
    navigation.navigate('buyTab', {})
  })
  const handleSellPress = useHandler(() => {
    navigation.navigate('sellTab', {})
  })
  const handleFioPress = useHandler(() => {
    navigation.navigate('fioAddressList', {})
  })
  const handleSwapPress = useHandler(() => {
    navigation.navigate('swapTab', {})
  })
  const handleViewAssetsPress = useHandler(() => {
    navigation.navigate('walletsTab', { screen: 'walletList' })
  })
  const handleScroll = useSceneScrollHandler()

  const [blogPosts, setBlogPosts] = React.useState<BlogPost[]>([])

  // Check for BlogPosts from info server:
  React.useEffect(() => {
    fetchInfo(`v1/blogPosts/${config.appId ?? 'edge'}`)
      .then(async res => {
        const infoData = await res.json()
        setBlogPosts(asBlogPosts(infoData))
      })
      .catch(e => console.log(String(e)))
  }, [])

  const renderBlog: ListRenderItem<BlogPost> = useHandler(({ item }) => <BlogCard blogPost={item} />)

  const buyCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-buy-crypto') }), [theme])
  const sellCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-sell-crypto') }), [theme])
  const fioIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-fio') }), [theme])
  const tradeCryptoIcon = React.useMemo(() => ({ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-trade') }), [theme])
  const homeRowStyle = React.useMemo(() => [styles.homeRowContainer, { height: cardSize }], [styles, cardSize])

  return (
    <SceneWrapper hasNotifications hasTabs>
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <WiredProgressBar />
          <Animated.ScrollView
            onScroll={handleScroll}
            style={undoInsetStyle}
            contentContainerStyle={[{ ...insetStyle, paddingBottom: insetStyle.paddingBottom }]}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          >
            <SectionView extendRight marginRem={TEMP_PADDING_REM}>
              <>
                <EdgeAnim enter={fadeInUp140}>
                  <BalanceCardUi4 onViewAssetsPress={handleViewAssetsPress} navigation={navigation} />
                </EdgeAnim>
                {/* Animation inside PromoCardsUi4 component */}
                <PromoCardsUi4 navigation={navigation} screenWidth={screenWidth} />
                <EdgeAnim style={homeRowStyle} enter={fadeInUp80}>
                  <HomeCardUi4
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
                  <HomeCardUi4
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
                <EdgeAnim style={homeRowStyle} enter={fadeInUp60}>
                  <HomeCardUi4
                    title={lstrings.fio_web3}
                    footer={lstrings.fio_web3_footer}
                    gradientBackground={theme.fioCardGradient}
                    nodeBackground={
                      <View style={styles.backroundImageContainer}>
                        <FastImage source={fioIcon} style={styles.backgroundImage} resizeMode="stretch" />
                      </View>
                    }
                    onPress={handleFioPress}
                  />
                  <HomeCardUi4
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
                </EdgeAnim>
              </>
              <>
                <SectionHeaderUi4 leftTitle={lstrings.title_markets} rightNode={lstrings.see_all} onRightPress={() => navigation.navigate('coinRanking', {})} />
                <EdgeAnim enter={fadeInUp30}>
                  <MarketsCardUi4 navigation={navigation} numRows={5} />
                </EdgeAnim>
              </>
              {blogPosts == null || blogPosts.length === 0 ? null : (
                <>
                  <SectionHeaderUi4 leftTitle={lstrings.title_learn} />
                  <CarouselUi4 data={blogPosts} renderItem={renderBlog} height={theme.rem(13)} width={screenWidth} />
                </>
              )}
              <SupportCardUi4
                title={lstrings.title_support}
                body={lstrings.body_support}
                buttonText={lstrings.button_support}
                url={config.supportContactSite}
              />
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
