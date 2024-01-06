import { asBlogPosts, BlogPost } from 'edge-info-server/types'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { isMaestro } from 'react-native-is-maestro'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getUi4ImageUri } from '../../../util/CdnUris'
import { fetchInfo } from '../../../util/network'
import { EdgeAnim } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { PasswordReminderModal } from '../../modals/PasswordReminderModal'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { BalanceCardUi4 } from '../BalanceCardUi4'
import { BlogCard } from '../BlogCard'
import { CarouselUi4 } from '../CarouselUi4'
import { HomeCardUi4 } from '../HomeCardUi4'
import { MarketsCardUi4 } from '../MarketsCardUi4'
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

  const needsPasswordCheck = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)

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
    navigation.navigate('exchangeTab', {})
  })
  const handleViewAssetsPress = useHandler(() => {
    navigation.navigate('walletsTab', { screen: 'walletList' })
  })

  const [blogPosts, setBlogPosts] = React.useState<BlogPost[]>([])

  // Check for AssetStatuses from info server (known sync issues, etc):
  React.useEffect(() => {
    fetchInfo(`v1/blogPosts/${config.appId ?? 'edge'}`)
      .then(async res => {
        const infoData = await res.json()
        setBlogPosts(asBlogPosts(infoData))
      })
      .catch(e => console.log(String(e)))
  }, [])

  // Show the password reminder on mount if required:
  useAsyncEffect(
    async () => {
      if (needsPasswordCheck && !isMaestro()) {
        await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <SceneWrapper hasNotifications hasTabs scroll>
      <View style={styles.tempMargin}>
        <SectionView extendRight>
          <>
            <EdgeAnim enter={{ type: 'fadeInUp', distance: 120 }}>
              <BalanceCardUi4 onViewAssetsPress={handleViewAssetsPress} navigation={navigation} />
            </EdgeAnim>
            <EdgeAnim style={[styles.homeRowContainer, { height: cardSize }]} enter={{ type: 'fadeInUp', distance: 60 }}>
              <HomeCardUi4
                title={lstrings.buy_crypto}
                footer={lstrings.buy_crypto_footer}
                gradientBackground={theme.buyCardGradientUi4}
                nodeBackground={
                  <View style={styles.backroundImageContainer}>
                    <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-buy-crypto') }} style={styles.backgroundImage} resizeMode="stretch" />
                  </View>
                }
                onPress={handleBuyPress}
              />
              <HomeCardUi4
                title={lstrings.sell_crypto}
                footer={lstrings.sell_crypto_footer}
                gradientBackground={theme.sellCardGradientUi4}
                nodeBackground={
                  <View style={styles.backroundImageContainer}>
                    <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-sell-crypto') }} style={styles.backgroundImage} resizeMode="stretch" />
                  </View>
                }
                onPress={handleSellPress}
              />
            </EdgeAnim>
            <EdgeAnim style={[styles.homeRowContainer, { height: cardSize }]} enter={{ type: 'fadeInUp', distance: 20 }}>
              <HomeCardUi4
                title={lstrings.fio_web3}
                footer={lstrings.fio_web3_footer}
                gradientBackground={theme.fioCardGradientUi4}
                nodeBackground={
                  <View style={styles.backroundImageContainer}>
                    <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-fio') }} style={styles.backgroundImage} resizeMode="stretch" />
                  </View>
                }
                onPress={handleFioPress}
              />
              <HomeCardUi4
                title={lstrings.swap_crypto}
                footer={lstrings.swap_crypto_footer}
                gradientBackground={theme.swapCardGradientUi4}
                nodeBackground={
                  <View style={styles.backroundImageContainer}>
                    <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-trade') }} style={styles.backgroundImage} resizeMode="stretch" />
                  </View>
                }
                onPress={handleSwapPress}
              />
            </EdgeAnim>
          </>
          <>
            <SectionHeaderUi4 leftTitle={lstrings.title_markets} rightNode={lstrings.see_all} onRightPress={() => navigation.navigate('coinRanking', {})} />
            <MarketsCardUi4 navigation={navigation} numRows={5} />
          </>
          {/* TODO: Reimplement after info server is published */}
          {blogPosts == null || blogPosts.length === 0 ? null : (
            <>
              <SectionHeaderUi4 leftTitle={lstrings.title_learn} />
              <View style={styles.carouselContainer}>
                <CarouselUi4 height={theme.rem(13)} width={screenWidth}>
                  {blogPosts.map((blogPost, index) => (
                    <BlogCard blogPost={blogPost} key={`${JSON.stringify(blogPost.localeTitle)}-${index}`} />
                  ))}
                </CarouselUi4>
              </View>
            </>
          )}
          <SupportCardUi4 title={lstrings.title_support} body={lstrings.body_support} buttonText={lstrings.button_support} url={config.supportContactSite} />
        </SectionView>
      </View>
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
  },
  carouselContainer: {
    left: theme.rem(-TEMP_PADDING_REM) // Need to fudge this to cancel out the scene's padding
  },

  // We plan to remove dividers that extend all the way to the right in the
  // future. In the interim, setting a margin instead of a SceneWrapper padding
  // lets us do that.
  tempMargin: {
    margin: theme.rem(TEMP_PADDING_REM)
  }
}))
