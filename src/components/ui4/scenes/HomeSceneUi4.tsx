import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { isMaestro } from 'react-native-is-maestro'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getUi4ImageUri } from '../../../util/CdnUris'
import { NotificationSceneWrapper } from '../../common/SceneWrapper'
import { PasswordReminderModal } from '../../modals/PasswordReminderModal'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { BalanceCardUi4 } from '../BalanceCardUi4'
import { BlogCard } from '../BlogCard'
import { CarouselUi4 } from '../CarouselUi4'
import { HomeCardUi4 } from '../HomeCardUi4'
import { MarketsCardUi4 } from '../MarketsCardUi4'
import { SectionHeader } from '../SectionHeader'
import { SectionView } from '../SectionView'

interface Props extends EdgeSceneProps<'home'> {}

const TEMP_PADDING_REM = 0.5 // To be built-in to SceneWrapper when fully UI4

const DUMMY_BLOG_DATA = [
  {
    localeTitle: {
      en: 'Latest Edge News 1',
      es: 'Que es Thorchain'
    },
    localeBody: {
      en: 'My blog body text\nlorem ipsum',
      es: 'El texto principal de mi blog'
    },
    localeBlogUrl: {
      en: 'https://edge.app/whatisthorchain',
      es: 'https://edge.app/whatisthorchain?lang=es'
    },
    lightImageUrl: 'https://edge.app/images/tc-dark.png',
    darkImageUrl: 'https://nyc3.digitaloceanspaces.com/edgecontent/UI4/testBlogImg.png'
  },
  {
    localeTitle: {
      en: 'Latest Edge News 2',
      es: 'Que es Thorchain'
    },
    localeBody: {
      en: 'My blog body text\nlorem ipsum',
      es: 'El texto principal de mi blog'
    },
    localeBlogUrl: {
      en: 'https://edge.app/whatisthorchain',
      es: 'https://edge.app/whatisthorchain?lang=es'
    },
    lightImageUrl: 'https://edge.app/images/tc-dark.png',
    darkImageUrl: 'https://nyc3.digitaloceanspaces.com/edgecontent/UI4/testBlogImg.png'
  },
  {
    localeTitle: {
      en: 'Latest Edge News 3',
      es: 'Que es Thorchain'
    },
    localeBody: {
      en: 'My blog body text\nlorem ipsum',
      es: 'El texto principal de mi blog'
    },
    localeBlogUrl: {
      en: 'https://edge.app/whatisthorchain',
      es: 'https://edge.app/whatisthorchain?lang=es'
    },
    lightImageUrl: 'https://edge.app/images/tc-dark.png',
    darkImageUrl: 'https://nyc3.digitaloceanspaces.com/edgecontent/UI4/testBlogImg.png'
  }
]

export const HomeSceneUi4 = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { width: screenWidth } = useSafeAreaFrame()
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

  // TODO: Replace dummy data with info server data
  const blogData = DUMMY_BLOG_DATA

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
    <NotificationSceneWrapper navigation={navigation} scroll hasTabs padding={theme.rem(TEMP_PADDING_REM)}>
      <SectionView wideSpacing>
        <>
          <BalanceCardUi4 navigation={navigation} />
          <View style={styles.homeRowContainer}>
            <HomeCardUi4
              title={lstrings.buy_crypto}
              footer="lorem ipsum dolor sit amet"
              gradientBackground={theme.buyCardGradientUi4}
              nodeBackground={
                <View style={styles.backgroundContainer}>
                  <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-buy-crypto') }} style={styles.backgroundImage} resizeMode="stretch" />
                </View>
              }
              onPress={handleBuyPress}
            />
            <HomeCardUi4
              title={lstrings.sell_crypto}
              footer="lorem ipsum dolor sit amet"
              gradientBackground={theme.sellCardGradientUi4}
              nodeBackground={<>{/* TODO */}</>}
              onPress={handleSellPress}
            />
          </View>
          <View style={styles.homeRowContainer}>
            <HomeCardUi4
              title={lstrings.title_fio_names}
              footer="lorem ipsum dolor sit amet"
              gradientBackground={theme.fioCardGradientUi4}
              nodeBackground={
                <View style={styles.backgroundContainer}>
                  <FastImage source={{ uri: getUi4ImageUri(theme, 'cardBackgrounds/bg-fio') }} style={styles.backgroundImage} resizeMode="stretch" />
                </View>
              }
              onPress={handleFioPress}
            />
            <HomeCardUi4
              title={lstrings.swap_crypto}
              footer="lorem ipsum dolor sit amet"
              gradientBackground={theme.swapCardGradientUi4}
              nodeBackground={<>{/* TODO */}</>}
              onPress={handleSwapPress}
            />
          </View>
        </>
        <>
          <SectionHeader leftText={lstrings.title_markets} rightText={lstrings.see_all} onRightPress={() => navigation.navigate('marketsTab', {})} />
          <MarketsCardUi4 navigation={navigation} numRows={5} />
        </>
        <>
          <SectionHeader leftText={lstrings.title_learn} />
          {blogData == null || blogData.length === 0 ? null : (
            <View style={styles.carouselContainer}>
              <CarouselUi4 height={theme.rem(13)} width={screenWidth}>
                {blogData.map((blogPost, index) => (
                  <BlogCard blogPost={blogPost} key={`${JSON.stringify(blogPost.localeTitle)}-${index}`} />
                ))}
              </CarouselUi4>
            </View>
          )}
        </>
      </SectionView>
    </NotificationSceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  backgroundContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end'
  },
  backgroundImage: {
    aspectRatio: 1,
    height: '100%'
  },
  homeRowContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'stretch'
  },
  carouselContainer: {
    left: theme.rem(-TEMP_PADDING_REM) // Need to fudge this to cancel out the scene's padding
  }
}))
