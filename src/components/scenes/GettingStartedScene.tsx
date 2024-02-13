import { InitialRouteName } from 'edge-login-ui-rn'
import * as React from 'react'
import { useEffect } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import edgeLogoIcon from '../../assets/images/edgeLogo/Edge_logo_Icon_L.png'
import uspImage0 from '../../assets/images/gettingStarted/usp0.png'
import uspImage1 from '../../assets/images/gettingStarted/usp1.png'
import uspImage2 from '../../assets/images/gettingStarted/usp2.png'
import uspImage3 from '../../assets/images/gettingStarted/usp3.png'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ExperimentConfig } from '../../experimentConfig'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { ImageProp } from '../../types/Theme'
import { parseMarkedText } from '../../util/parseMarkedText'
import { logEvent } from '../../util/tracking'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SwipeOffsetDetector } from '../interactions/SwipeOffsetDetector'
import { Space } from '../layout/Space'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

const ANIM_DURATION = 1000

export interface GettingStartedParams {
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
}

interface Props extends EdgeSceneProps<'gettingStarted'> {}

interface SectionData {
  image: ImageProp
  key: string
  footnote?: string
  message: string
  title: string
}

const slide1 = {
  image: uspImage0,
  key: 'slide1',
  message: lstrings.getting_started_slide_1_message,
  title: lstrings.getting_started_slide_1_title,
  footnote: lstrings.getting_started_slide_1_footnote
}
const slide1Alt = {
  image: uspImage0,
  key: 'slide1Alt',
  message: lstrings.getting_started_slide_1_message_alt,
  title: lstrings.getting_started_slide_1_title,
  footnote: lstrings.getting_started_slide_1_footnote
}
const slide2 = {
  image: uspImage1,
  key: 'slide2',
  message: lstrings.getting_started_slide_2_message,
  title: lstrings.getting_started_slide_2_title
}
const slide3 = {
  image: uspImage2,
  key: 'slide3',
  message: lstrings.getting_started_slide_3_message,
  title: lstrings.getting_started_slide_3_title
}
const slide4 = {
  image: uspImage3,
  key: 'slide4',
  message: lstrings.getting_started_slide_4_message,
  title: lstrings.getting_started_slide_4_title
}

const sectionsVariantMap: { [key: string]: SectionData[] } = {
  default: [slide1, slide2, slide3, slide4],
  C_UspsMinusWGYC: [slide2, slide3, slide4],
  D_UspsAltWGYC: [slide1Alt, slide2, slide3, slide4]
}

export const GettingStartedScene = (props: Props) => {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const { experimentConfig } = route.params
  const { createAccountType, landingType } = experimentConfig
  const context = useSelector(state => state.core.context)
  const isLoggedIn = useSelector(state => state.ui.settings.settingsLoaded ?? false)
  const localUsers = useWatch(context, 'localUsers')
  const hasLocalUsers = localUsers.length > 0

  const sections: SectionData[] = sectionsVariantMap[landingType] ?? sectionsVariantMap.default

  // An extra index is added to account for the extra initial usp slide OR to
  // allow the SwipeOffsetDetector extra room for the user to swipe beyond to
  // trigger the final navigation.
  const paginationCount = sections.length + 1
  const swipeOffset = useSharedValue(0)

  // Route helpers
  const newAccountRoute: InitialRouteName = hasLocalUsers || createAccountType === 'full' ? 'new-account' : 'new-light-account'

  const passwordLoginRoute: InitialRouteName = hasLocalUsers || createAccountType === 'full' ? 'login-password' : 'login-password-light'

  const handleFinalSwipe = useHandler(() => {
    // This delay is necessary to properly reset the scene since it remains on
    // the stack.
    setTimeout(() => {
      swipeOffset.value = 0
    }, 500)

    dispatch(logEvent('Signup_Welcome'))

    // Either route to password login or account creation
    if (hasLocalUsers) {
      navigation.navigate('login', { loginUiInitialRoute: passwordLoginRoute, experimentConfig })
    } else {
      navigation.navigate('login', { loginUiInitialRoute: newAccountRoute, experimentConfig })
    }
  })

  const handlePressIndicator = useHandler((itemIndex: number) => {
    swipeOffset.value = withTiming(itemIndex)
  })

  const handlePressSignIn = useHandler(() => {
    dispatch(logEvent('Welcome_Signin'))
    navigation.navigate('login', { loginUiInitialRoute: passwordLoginRoute, experimentConfig })
  })

  const handlePressSignUp = useHandler(() => {
    dispatch(logEvent('Signup_Welcome'))
    navigation.navigate('login', { loginUiInitialRoute: newAccountRoute, experimentConfig })
  })

  const handlePressSkip = useHandler(() => {
    navigation.navigate('login', { experimentConfig })
  })

  // Redirect to login or new account screen if the user swipes past the last
  // USP section
  useAnimatedReaction(
    () => swipeOffset.value,
    value => {
      if (value === paginationCount) {
        runOnJS(handleFinalSwipe)()
      }
    }
  )

  // Redirect to login screen if device has memory of accounts
  // HACK: It's unknown how the localUsers dependency makes the routing work
  // properly, but use isLoggedIn explicitly to address the bug where this
  // effect would cause an unwanted navigation while logged in.
  useEffect(() => {
    if (localUsers.length > 0 && !isLoggedIn) {
      navigation.navigate('login', { experimentConfig })
    }
  }, [experimentConfig, isLoggedIn, localUsers, navigation])

  return (
    <SceneWrapper hasHeader={false}>
      <SkipButton swipeOffset={swipeOffset}>
        <Space left horizontal={1} vertical={0.5}>
          <TouchableOpacity onPress={handlePressSkip}>
            <EdgeText>{lstrings.skip}</EdgeText>
          </TouchableOpacity>
        </Space>
      </SkipButton>
      <SwipeOffsetDetector swipeOffset={swipeOffset} minOffset={0} maxOffset={paginationCount}>
        <Container>
          <HeroContainer>
            <WelcomeHero swipeOffset={swipeOffset}>
              <EdgeAnim enter={{ type: 'fadeInUp', duration: ANIM_DURATION, distance: 80 }}>
                <Image source={edgeLogoIcon} />
              </EdgeAnim>

              <EdgeAnim enter={{ type: 'fadeInUp', duration: ANIM_DURATION, distance: 60 }}>
                <WelcomeHeroTitle numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {parseMarkedText(lstrings.getting_started_welcome_title)}
                </WelcomeHeroTitle>
              </EdgeAnim>
              <EdgeAnim enter={{ type: 'fadeInUp', duration: ANIM_DURATION, distance: 40 }}>
                <WelcomeHeroMessage>{lstrings.getting_started_welcome_message}</WelcomeHeroMessage>
              </EdgeAnim>

              <EdgeAnim enter={{ type: 'fadeInUp', duration: ANIM_DURATION, distance: 20 }}>
                <WelcomeHeroPrompt>{lstrings.getting_started_welcome_prompt}</WelcomeHeroPrompt>
              </EdgeAnim>
            </WelcomeHero>
            {sections.map((section, index) => {
              return (
                <HeroItem key={section.key} swipeOffset={swipeOffset} itemIndex={index + 1}>
                  <HeroImageContainer>
                    <HeroImage source={section.image} />
                  </HeroImageContainer>
                </HeroItem>
              )
            })}
          </HeroContainer>
          <Pagination>
            {Array.from({ length: paginationCount }).map((_, index) => (
              <Pressable key={index} onPress={() => handlePressIndicator(index)}>
                <PageIndicator swipeOffset={swipeOffset} itemIndex={index} />
              </Pressable>
            ))}
          </Pagination>
          <SectionCoverAnimated swipeOffset={swipeOffset}>
            <Sections swipeOffset={swipeOffset}>
              {sections.map((section, index) => {
                return (
                  <Section key={section.key} swipeOffset={swipeOffset} itemIndex={index + 1}>
                    <ScrollView scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
                      <SectionTitle numberOfLines={2}>{parseMarkedText(section.title)}</SectionTitle>
                      <SectionParagraph numberOfLines={undefined}>{section.message}</SectionParagraph>
                      {section.footnote == null ? null : <Footnote numberOfLines={undefined}>{lstrings.getting_started_slide_1_footnote}</Footnote>}
                    </ScrollView>
                  </Section>
                )
              })}
            </Sections>
            <ButtonsViewUi4
              animDistanceStart={40}
              primary={{
                label: lstrings.account_get_started,
                onPress: handlePressSignUp
              }}
              tertiary={{
                label: lstrings.getting_started_button_sign_in,
                onPress: handlePressSignIn
              }}
            />
          </SectionCoverAnimated>
        </Container>
      </SwipeOffsetDetector>
    </SceneWrapper>
  )
}

// -----------------------------------------------------------------------------
// Local Components
// -----------------------------------------------------------------------------

const Container = styled(View)({
  flex: 1
})

//
// Skip Button
//

const SkipButton = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(
  _theme => props =>
    useAnimatedStyle(() => {
      return {
        opacity: interpolate(props.swipeOffset.value, [0, 1], [0, 1], Extrapolation.CLAMP)
      }
    })
)

//
// Hero
//

const HeroContainer = styled(View)({
  flex: 1,
  alignItems: 'center'
})

const WelcomeHero = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(_theme => props => [
  {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  useAnimatedStyle(() => ({
    opacity: interpolate(props.swipeOffset.value, [0, 0.5], [1, 0]),
    transform: [{ scale: interpolate(props.swipeOffset.value, [0, 1], [1, 0], Extrapolation.CLAMP) }]
  }))
])

const WelcomeHeroTitle = styled(Text)(theme => ({
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(2.25),
  includeFontPadding: false,
  lineHeight: theme.rem(2.8),
  paddingVertical: theme.rem(1),
  textAlign: 'center'
}))
const WelcomeHeroMessage = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.78),
  paddingVertical: theme.rem(1),
  textAlign: 'center'
}))
const WelcomeHeroPrompt = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  fontFamily: theme.fontFaceBold,
  textAlign: 'center'
}))

const HeroItem = styled(Animated.View)<{ swipeOffset: SharedValue<number>; itemIndex: number }>(theme => props => {
  const { swipeOffset, itemIndex } = props
  const isFirstItem = itemIndex === 1
  const { width: screenWidth } = useSafeAreaFrame()
  const translateWidth = screenWidth
  return [
    {
      alignItems: 'center',
      aspectRatio: 1,
      padding: theme.rem(1),
      position: 'absolute',
      height: '100%',
      width: '100%'
    },
    useAnimatedStyle(() => {
      const opacity = interpolate(swipeOffset.value, [itemIndex - 1, itemIndex, itemIndex + 1], [0, 1, 0], Extrapolation.CLAMP)
      const scale = interpolate(swipeOffset.value, [itemIndex - 1, itemIndex, itemIndex + 1], [0.3, 1, 0.3])
      const translateX = interpolate(swipeOffset.value, [itemIndex - 1, itemIndex, itemIndex + 1], [isFirstItem ? 0 : translateWidth, 0, -translateWidth])
      return {
        opacity,
        transform: [{ translateX }, { scale }]
      }
    })
  ]
})

const HeroImageContainer = styled(View)({
  alignItems: 'stretch',
  aspectRatio: 1,
  backgroundColor: 'white',
  borderRadius: 1000,
  maxHeight: '100%',
  overflow: 'hidden',
  width: '100%'
})
const HeroImage = styled(Image)({
  maxHeight: '100%',
  maxWidth: '100%',
  aspectRatio: 1
})

//
// Pagination
//

const Pagination = styled(View)(theme => ({
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: theme.rem(0.7)
}))

const PageIndicator = styled(Animated.View)<{ swipeOffset: SharedValue<number>; itemIndex: number }>(theme => props => [
  {
    borderRadius: 10,
    margin: theme.rem(0.3),
    height: theme.rem(0.6),
    width: theme.rem(0.6)
  },
  useAnimatedStyle(() => {
    const delta = 1 - Math.max(0, Math.min(1, Math.abs(props.itemIndex - props.swipeOffset.value)))
    const opacity = interpolate(delta, [0, 1], [0.5, 1])
    const backgroundColor = interpolateColor(delta, [0, 1], [theme.icon, theme.iconTappable])
    return {
      backgroundColor,
      opacity
    }
  })
])

//
// Sections
//

const SectionCoverAnimated = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(theme => props => {
  const themeRem = theme.rem(1)
  const insets = useSafeAreaInsets()

  return [
    {
      alignItems: 'stretch',
      justifyContent: 'space-between',
      paddingVertical: theme.rem(1),
      paddingBottom: insets.bottom + theme.rem(1),
      marginBottom: -insets.bottom
    },
    useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(props.swipeOffset.value, [0, 1], [`${theme.modal}00`, theme.modalLikeBackground])
      const paddingVertical = interpolate(props.swipeOffset.value, [0, 1], [0, themeRem], Extrapolation.CLAMP)
      const flexGrow = interpolate(props.swipeOffset.value, [0, 1], [0, 1.2], Extrapolation.CLAMP)
      return {
        backgroundColor,
        paddingVertical,
        flexGrow
      }
    })
  ]
})

const Sections = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(theme => props => [
  {
    paddingBottom: theme.rem(1)
  },
  useAnimatedStyle(() => {
    const flexGrow = interpolate(props.swipeOffset.value, [0, 1], [0, 1.5])
    return {
      flexGrow
    }
  })
])

const Section = styled(Animated.View)<{ swipeOffset: SharedValue<number>; itemIndex: number }>(theme => props => {
  const { swipeOffset, itemIndex } = props
  const isFirstItem = itemIndex === 1
  const { width: screenWidth } = useSafeAreaFrame()
  const translateWidth = screenWidth / 2
  return [
    {
      marginHorizontal: theme.rem(2),
      position: 'absolute',
      height: '100%'
    },
    useAnimatedStyle(() => {
      const opacity = interpolate(swipeOffset.value, [itemIndex - 1, itemIndex, itemIndex + 1], [0, 1, 0])
      const translateX = interpolate(swipeOffset.value, [itemIndex - 1, itemIndex, itemIndex + 1], [isFirstItem ? 0 : translateWidth, 0, -translateWidth])
      return {
        transform: [{ translateX }],
        opacity
      }
    })
  ]
})

const SectionTitle = styled(EdgeText)(theme => ({
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(1.6875),
  includeFontPadding: false
}))

const SectionParagraph = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  marginVertical: theme.rem(1)
}))

const Footnote = styled(EdgeText)(theme => ({
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.6),
  marginBottom: theme.rem(1),
  opacity: 0.75,
  includeFontPadding: false
}))
