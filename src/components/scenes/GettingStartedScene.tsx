import * as React from 'react'
import { Image, Pressable, View } from 'react-native'
import { GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'

import edgeLogoIcon from '../../assets/images/edgeLogo/Edge_logo_Icon_L.png'
import uspImage0 from '../../assets/images/gettingStarted/usp0.png'
import uspImage1 from '../../assets/images/gettingStarted/usp1.png'
import uspImage2 from '../../assets/images/gettingStarted/usp2.png'
import uspImage3 from '../../assets/images/gettingStarted/usp3.png'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import type { ExperimentConfig } from '../../experimentConfig'
import { useCarouselGesture } from '../../hooks/useCarouselGesture'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { RootSceneProps } from '../../types/routerTypes'
import type { ImageProp } from '../../types/Theme'
import { parseMarkedText } from '../../util/parseMarkedText'
import { logEvent } from '../../util/tracking'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { Space } from '../layout/Space'
import { type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeText } from '../themed/EdgeText'

const ANIM_DURATION = 1000

export interface GettingStartedParams {
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
}

interface Props extends RootSceneProps<'gettingStarted'> {}

interface SectionData {
  image: ImageProp
  key: string
  footnote?: string
  message: string
  title: string
}

const sections: SectionData[] = [
  {
    image: uspImage0,
    key: 'slide1',
    message: lstrings.getting_started_slide_1_message,
    title: lstrings.getting_started_slide_1_title,
    footnote: lstrings.getting_started_slide_1_footnote
  },
  {
    image: uspImage1,
    key: 'slide2',
    message: lstrings.getting_started_slide_2_message,
    title: lstrings.getting_started_slide_2_title
  },
  {
    image: uspImage2,
    key: 'slide3',
    message: lstrings.getting_started_slide_3_message,
    title: lstrings.getting_started_slide_3_title
  },
  {
    image: uspImage3,
    key: 'slide4',
    message: lstrings.getting_started_slide_4_message,
    title: lstrings.getting_started_slide_4_title
  }
]

export const GettingStartedScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const insets = useSafeAreaInsets()
  const { experimentConfig } = route.params
  const context = useSelector(state => state.core.context)
  const hasLocalUsers = context.localUsers.length > 0
  const { width: screenWidth } = useSafeAreaFrame()

  const handleIndexChange = (index: number): void => {
    // Redirect to login or new account screen
    // if the user swipes past the last USP section
    if (index === paginationCount) {
      handleCompleteUsps()
    }
  }

  // Section 0 is the welcome hero, which isn't in the array:
  const paginationCount = sections.length + 1
  const { gesture, scrollIndex } = useCarouselGesture(
    // Add 1 so we can swipe off the end:
    paginationCount + 1,
    screenWidth,
    handleIndexChange
  )

  // Route helpers
  const visitPasswordScene = (): void => {
    navigation.replace('login', {
      loginUiInitialRoute: 'login-password',
      experimentConfig
    })
  }

  const visitNewAccountScene = (): void =>
    // Android needs replace instead of navigate or the loginUiInitialRoute
    // doesn't work...
    {
      navigation.replace('login', {
        // Only create light accounts if no other accounts exist
        loginUiInitialRoute: hasLocalUsers
          ? 'new-account'
          : 'new-light-account',
        experimentConfig
      })
    }

  const handleCompleteUsps = useHandler(() => {
    // This delay is necessary to properly reset the scene since it remains on
    // the stack.
    setTimeout(() => {
      scrollIndex.value = 0
      handleIndexChange(0)
    }, 500)

    dispatch(logEvent('Signup_Welcome'))

    // Either route to password login or account creation
    if (hasLocalUsers) {
      visitPasswordScene()
    } else {
      visitNewAccountScene()
    }
  })

  const handlePressIndicator = useHandler((itemIndex: number) => () => {
    scrollIndex.value = withTiming(itemIndex)
    handleIndexChange(itemIndex)
  })

  const handlePressSignIn = useHandler(() => {
    dispatch(logEvent('Welcome_Signin'))
    visitPasswordScene()
  })

  const handleProgressButtonPress = useHandler(() => {
    // If we're at the last slide, navigate to account creation
    if (scrollIndex.value >= sections.length) {
      dispatch(logEvent('Signup_Welcome'))
      handleCompleteUsps()
    } else {
      // Otherwise, advance to the next slide
      const nextIndex = Math.min(
        Math.floor(scrollIndex.value) + 1,
        sections.length
      )
      scrollIndex.value = withTiming(nextIndex)
      handleIndexChange(nextIndex)
    }
  })

  // ---------------------------------------------------------------------------
  // Animated Styles
  // ---------------------------------------------------------------------------

  // Skip button animation
  const skipButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP)
  }))

  // Welcome hero animation
  const welcomeHeroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollIndex.value, [0, 0.5], [1, 0]),
    transform: [
      {
        scale: interpolate(
          scrollIndex.value,
          [0, 1],
          [1, 0],
          Extrapolation.CLAMP
        )
      }
    ]
  }))

  // Section cover animation
  const themeRem = theme.rem(1)
  const themeModal = theme.modal
  const themeModalLikeBackground = theme.modalLikeBackground

  const sectionCoverAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollIndex.value,
      [0, 1],
      [`${themeModal}00`, themeModalLikeBackground]
    )
    const paddingVertical = interpolate(
      scrollIndex.value,
      [0, 1],
      [0, themeRem],
      Extrapolation.CLAMP
    )
    const flexGrow = interpolate(
      scrollIndex.value,
      [0, 1],
      [0, 1.2],
      Extrapolation.CLAMP
    )
    return { backgroundColor, paddingVertical, flexGrow }
  })

  const sectionCoverStaticStyle = React.useMemo(
    () => ({
      alignItems: 'stretch' as const,
      justifyContent: 'flex-end' as const,
      paddingVertical: theme.rem(1),
      paddingBottom: insets.bottom + theme.rem(1),
      marginBottom: -insets.bottom
    }),
    [theme, insets.bottom]
  )

  // Sections container animation
  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    flexGrow: interpolate(scrollIndex.value, [0, 1], [0, 1.5])
  }))

  // Button animations - "Get Started" at index 0, "Next" at index > 0
  const getStartedButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollIndex.value,
      [0, 0.5],
      [1, 0],
      Extrapolation.CLAMP
    )
  }))
  const nextButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollIndex.value,
      [0, 0.5],
      [0, 1],
      Extrapolation.CLAMP
    )
  }))

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SceneWrapper hasHeader={false}>
      <Animated.View style={skipButtonAnimatedStyle}>
        <Space alignRight horizontalRem={1} verticalRem={0.5}>
          <EdgeTouchableOpacity onPress={handleCompleteUsps}>
            <EdgeText>{lstrings.skip}</EdgeText>
          </EdgeTouchableOpacity>
        </Space>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <View style={styles.container}>
          <View style={styles.heroContainer}>
            <Animated.View
              style={[styles.welcomeHero, welcomeHeroAnimatedStyle]}
            >
              <EdgeAnim
                noLayoutAnimation
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 80
                }}
              >
                <Image source={edgeLogoIcon} />
              </EdgeAnim>

              <EdgeAnim
                noLayoutAnimation
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 60
                }}
              >
                <UnscaledText
                  style={styles.welcomeHeroTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {parseMarkedText(lstrings.getting_started_welcome_title)}
                </UnscaledText>
              </EdgeAnim>
              <EdgeAnim
                noLayoutAnimation
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 40
                }}
              >
                <EdgeText style={styles.welcomeHeroMessage}>
                  {lstrings.getting_started_welcome_message}
                </EdgeText>
              </EdgeAnim>

              <EdgeAnim
                noLayoutAnimation
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 20
                }}
              >
                <EdgeTouchableOpacity onPress={handleProgressButtonPress}>
                  <EdgeText style={styles.welcomeHeroPrompt}>
                    {lstrings.learn_more}
                  </EdgeText>
                </EdgeTouchableOpacity>
              </EdgeAnim>
            </Animated.View>
            {sections.map((section, index) => (
              <HeroItem
                key={section.key}
                image={section.image}
                itemIndex={index + 1}
                scrollIndex={scrollIndex}
              />
            ))}
          </View>
          <EdgeAnim
            noLayoutAnimation
            enter={{
              type: 'fadeIn',
              duration: ANIM_DURATION,
              distance: 20
            }}
          >
            <View style={styles.pagination}>
              {Array.from({ length: paginationCount }).map((_, index) => (
                <Pressable key={index} onPress={handlePressIndicator(index)}>
                  <PageIndicator itemIndex={index} scrollIndex={scrollIndex} />
                </Pressable>
              ))}
            </View>
          </EdgeAnim>
          <Animated.View
            style={[sectionCoverStaticStyle, sectionCoverAnimatedStyle]}
          >
            <Animated.View style={[styles.sections, sectionsAnimatedStyle]}>
              {sections.map((section, index) => (
                <SectionItem
                  key={section.key}
                  section={section}
                  itemIndex={index + 1}
                  scrollIndex={scrollIndex}
                />
              ))}
            </Animated.View>

            <View style={styles.buttonFadeContainer}>
              <EdgeAnim
                noLayoutAnimation
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 20
                }}
              >
                <Animated.View
                  style={[styles.buttonAbsolute, getStartedButtonAnimatedStyle]}
                >
                  <ButtonsView
                    layout="column"
                    primary={{
                      label: lstrings.account_get_started,
                      onPress: handleProgressButtonPress
                    }}
                  />
                </Animated.View>
                <Animated.View style={nextButtonAnimatedStyle}>
                  <ButtonsView
                    layout="column"
                    primary={{
                      label: lstrings.string_next_capitalized,
                      onPress: handleProgressButtonPress
                    }}
                  />
                </Animated.View>
              </EdgeAnim>
            </View>
            <EdgeTouchableOpacity
              style={styles.tertiaryTouchable}
              onPress={handlePressSignIn}
            >
              <EdgeText style={styles.tertiaryText} numberOfLines={0}>
                {lstrings.getting_started_already_have_an_account}
                <EdgeText style={styles.tappableText} numberOfLines={0}>
                  {lstrings.getting_started_sign_in}
                </EdgeText>
              </EdgeText>
            </EdgeTouchableOpacity>
          </Animated.View>
        </View>
      </GestureDetector>
    </SceneWrapper>
  )
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  heroContainer: {
    flex: 1,
    alignItems: 'center'
  },
  welcomeHero: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  welcomeHeroTitle: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(2.25),
    includeFontPadding: false,
    lineHeight: theme.rem(2.8),
    paddingVertical: theme.rem(1),
    textAlign: 'center'
  },
  welcomeHeroMessage: {
    fontSize: theme.rem(0.78),
    paddingVertical: theme.rem(1),
    textAlign: 'center'
  },
  welcomeHeroPrompt: {
    fontSize: theme.rem(0.75),
    color: theme.textLink,
    fontFamily: theme.fontFaceBold,
    textAlign: 'center',
    margin: theme.rem(0.5)
  },
  heroItem: {
    alignItems: 'center',
    aspectRatio: 1,
    padding: theme.rem(1),
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  heroImageContainer: {
    alignItems: 'stretch',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 1000,
    maxHeight: '100%',
    overflow: 'hidden',
    width: '100%'
  },
  heroImage: {
    maxHeight: '100%',
    maxWidth: '100%',
    aspectRatio: 1
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.rem(0.7)
  },
  pageIndicator: {
    borderRadius: 10,
    margin: theme.rem(0.3),
    height: theme.rem(0.6),
    width: theme.rem(0.6)
  },
  sections: {
    paddingBottom: theme.rem(1)
  },
  section: {
    marginHorizontal: theme.rem(2),
    position: 'absolute',
    height: '100%'
  },
  sectionTitle: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.6875),
    includeFontPadding: false
  },
  sectionParagraph: {
    fontSize: theme.rem(0.75),
    marginVertical: theme.rem(1)
  },
  footnote: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    marginBottom: theme.rem(1),
    includeFontPadding: false
  },
  buttonFadeContainer: {
    flexShrink: 1,
    flexGrow: 0
  },
  buttonAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0
  },
  tertiaryTouchable: {
    marginVertical: theme.rem(0.5),
    alignItems: 'center'
  },
  tertiaryText: {
    color: theme.textInputTextColorDisabled
  },
  tappableText: {
    color: theme.iconTappable
  }
}))

// -----------------------------------------------------------------------------
// Animated Components
// -----------------------------------------------------------------------------

interface HeroItemProps {
  image: ImageProp
  itemIndex: number
  scrollIndex: SharedValue<number>
}

const HeroItem: React.FC<HeroItemProps> = props => {
  const { image, itemIndex, scrollIndex } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { width: screenWidth } = useSafeAreaFrame()

  const animatedStyle = useAnimatedStyle(() => {
    const isFirstItem = itemIndex === 1
    const opacity = interpolate(
      scrollIndex.value,
      [itemIndex - 1, itemIndex, itemIndex + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      scrollIndex.value,
      [itemIndex - 1, itemIndex, itemIndex + 1],
      [0.3, 1, 0.3]
    )
    const translateX = interpolate(
      scrollIndex.value,
      [itemIndex - 1, itemIndex, itemIndex + 1],
      [isFirstItem ? 0 : screenWidth, 0, -screenWidth]
    )
    return { opacity, transform: [{ translateX }, { scale }] }
  })

  return (
    <Animated.View style={[styles.heroItem, animatedStyle]}>
      <View style={styles.heroImageContainer}>
        <Image source={image} style={styles.heroImage} />
      </View>
    </Animated.View>
  )
}

interface PageIndicatorProps {
  itemIndex: number
  scrollIndex: SharedValue<number>
}

const PageIndicator: React.FC<PageIndicatorProps> = props => {
  const { itemIndex, scrollIndex } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const themeIcon = theme.icon
  const themeIconTappable = theme.iconTappable

  const animatedStyle = useAnimatedStyle(() => {
    const delta =
      1 - Math.max(0, Math.min(1, Math.abs(itemIndex - scrollIndex.value)))
    return {
      backgroundColor: interpolateColor(
        delta,
        [0, 1],
        [themeIcon, themeIconTappable]
      ),
      opacity: interpolate(delta, [0, 1], [0.5, 1])
    }
  })

  return <Animated.View style={[styles.pageIndicator, animatedStyle]} />
}

interface SectionItemProps {
  section: SectionData
  itemIndex: number
  scrollIndex: SharedValue<number>
}

const SectionItem: React.FC<SectionItemProps> = props => {
  const { section, itemIndex, scrollIndex } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { width: screenWidth } = useSafeAreaFrame()
  const translateWidth = screenWidth / 2

  const animatedStyle = useAnimatedStyle(() => {
    const isFirstItem = itemIndex === 1
    const opacity = interpolate(
      scrollIndex.value,
      [itemIndex - 1, itemIndex, itemIndex + 1],
      [0, 1, 0]
    )
    const translateX = interpolate(
      scrollIndex.value,
      [itemIndex - 1, itemIndex, itemIndex + 1],
      [isFirstItem ? 0 : translateWidth, 0, -translateWidth]
    )
    return { transform: [{ translateX }], opacity }
  })

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <ScrollView scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <EdgeText style={styles.sectionTitle} numberOfLines={2}>
          {parseMarkedText(section.title)}
        </EdgeText>
        <EdgeText style={styles.sectionParagraph} numberOfLines={0}>
          {section.message}
        </EdgeText>
        {section.footnote == null ? null : (
          <EdgeText style={styles.footnote} numberOfLines={0}>
            {section.footnote}
          </EdgeText>
        )}
      </ScrollView>
    </Animated.View>
  )
}
