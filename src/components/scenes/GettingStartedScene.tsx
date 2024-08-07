import * as React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
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
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { ImageProp } from '../../types/Theme'
import { parseMarkedText } from '../../util/parseMarkedText'
import { logEvent } from '../../util/tracking'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SwipeOffsetDetector } from '../interactions/SwipeOffsetDetector'
import { Space } from '../layout/Space'
import { EdgeText } from '../themed/EdgeText'

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

export const GettingStartedScene = (props: Props) => {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const { experimentConfig } = route.params
  const context = useSelector(state => state.core.context)
  const hasLocalUsers = context.localUsers.length > 0
  const lightAccounts = experimentConfig.createAccountType === 'light' && !hasLocalUsers

  // An extra index is added to account for the extra initial usp slide OR to
  // allow the SwipeOffsetDetector extra room for the user to swipe beyond to
  // trigger the final navigation.
  const paginationCount = sections.length + 1
  const swipeOffset = useSharedValue(0)

  // Route helpers
  const visitPasswordScene = (): void =>
    navigation.replace('login', {
      loginUiInitialRoute: lightAccounts ? 'login-password-light' : 'login-password',
      experimentConfig
    })

  const visitNewAccountScene = (): void =>
    // Android needs replace instead of navigate or the loginUiInitialRoute
    // doesn't work...
    navigation.replace('login', {
      loginUiInitialRoute: lightAccounts ? 'new-light-account' : 'new-account',
      experimentConfig
    })

  const handleFinalSwipe = useHandler(() => {
    // This delay is necessary to properly reset the scene since it remains on
    // the stack.
    setTimeout(() => {
      swipeOffset.value = 0
    }, 500)

    dispatch(logEvent('Signup_Welcome'))

    // Either route to password login or account creation
    if (hasLocalUsers) {
      visitPasswordScene()
    } else {
      visitNewAccountScene()
    }
  })

  const handlePressIndicator = useHandler((itemIndex: number) => {
    swipeOffset.value = withTiming(itemIndex)
  })

  const handlePressSignIn = useHandler(() => {
    dispatch(logEvent('Welcome_Signin'))
    visitPasswordScene()
  })

  const handlePressSignUp = useHandler(() => {
    dispatch(logEvent('Signup_Welcome'))
    visitNewAccountScene()
  })

  const handlePressSkip = useHandler(() => {
    navigation.replace('login', { experimentConfig })
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

  return (
    <SceneWrapper hasHeader={false}>
      <SkipButton swipeOffset={swipeOffset}>
        <Space alignRight horizontalRem={1} verticalRem={0.5}>
          <EdgeTouchableOpacity onPress={handlePressSkip}>
            <EdgeText>{lstrings.skip}</EdgeText>
          </EdgeTouchableOpacity>
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
            <ButtonsView
              layout="column"
              primary={{
                label: lstrings.account_get_started,
                onPress: handlePressSignUp
              }}
            />
            <TertiaryTouchable onPress={handlePressSignIn}>
              <TertiaryText>
                {/* eslint-disable-next-line react-native/no-raw-text */}
                {`${lstrings.getting_started_already_have_an_account} `}
                <TappableText>{lstrings.getting_started_sign_in}</TappableText>
              </TertiaryText>
            </TertiaryTouchable>
          </SectionCoverAnimated>
        </Container>
      </SwipeOffsetDetector>
    </SceneWrapper>
  )
}

// -----------------------------------------------------------------------------
// Local Components
// -----------------------------------------------------------------------------

const TertiaryTouchable = styled(EdgeTouchableOpacity)(theme => props => ({
  marginVertical: theme.rem(0.5),
  alignItems: 'center'
}))

const TertiaryText = styled(EdgeText)(theme => props => ({
  color: theme.textInputTextColorDisabled
}))

const TappableText = styled(EdgeText)(theme => props => ({
  color: theme.iconTappable
}))

const Container = styled(View)({
  flex: 1
})

//
// Skip Button
//

const SkipButton = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(_theme => props => {
  const { swipeOffset } = props
  return useAnimatedStyle(() => {
    return {
      opacity: interpolate(swipeOffset.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    }
  })
})

//
// Hero
//

const HeroContainer = styled(View)({
  flex: 1,
  alignItems: 'center'
})

const WelcomeHero = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(_theme => props => {
  const { swipeOffset } = props
  return [
    {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1
    },
    useAnimatedStyle(() => ({
      opacity: interpolate(swipeOffset.value, [0, 0.5], [1, 0]),
      transform: [{ scale: interpolate(swipeOffset.value, [0, 1], [1, 0], Extrapolation.CLAMP) }]
    }))
  ]
})

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

const PageIndicator = styled(Animated.View)<{ swipeOffset: SharedValue<number>; itemIndex: number }>(theme => props => {
  const themeIcon = theme.icon
  const themeIconTappable = theme.iconTappable
  const { itemIndex, swipeOffset } = props
  return [
    {
      borderRadius: 10,
      margin: theme.rem(0.3),
      height: theme.rem(0.6),
      width: theme.rem(0.6)
    },
    useAnimatedStyle(() => {
      const delta = 1 - Math.max(0, Math.min(1, Math.abs(itemIndex - swipeOffset.value)))
      const opacity = interpolate(delta, [0, 1], [0.5, 1])
      const backgroundColor = interpolateColor(delta, [0, 1], [themeIcon, themeIconTappable])
      return {
        backgroundColor,
        opacity
      }
    })
  ]
})

//
// Sections
//

const SectionCoverAnimated = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(theme => props => {
  const { swipeOffset } = props
  const themeRem = theme.rem(1)
  const themeModal = theme.modal
  const themeModalLikeBackground = theme.modalLikeBackground
  const insets = useSafeAreaInsets()

  return [
    {
      alignItems: 'stretch',
      justifyContent: 'flex-end',
      paddingVertical: theme.rem(1),
      paddingBottom: insets.bottom + theme.rem(1),
      marginBottom: -insets.bottom
    },
    useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(swipeOffset.value, [0, 1], [`${themeModal}00`, themeModalLikeBackground])
      const paddingVertical = interpolate(swipeOffset.value, [0, 1], [0, themeRem], Extrapolation.CLAMP)
      const flexGrow = interpolate(swipeOffset.value, [0, 1], [0, 1.2], Extrapolation.CLAMP)
      return {
        backgroundColor,
        paddingVertical,
        flexGrow
      }
    })
  ]
})

const Sections = styled(Animated.View)<{ swipeOffset: SharedValue<number> }>(theme => props => {
  const { swipeOffset } = props
  return [
    {
      paddingBottom: theme.rem(1)
    },
    useAnimatedStyle(() => {
      const flexGrow = interpolate(swipeOffset.value, [0, 1], [0, 1.5])
      return {
        flexGrow
      }
    })
  ]
})

const Section = styled(Animated.View)<{ swipeOffset: SharedValue<number>; itemIndex: number }>(theme => props => {
  const { itemIndex, swipeOffset } = props
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
