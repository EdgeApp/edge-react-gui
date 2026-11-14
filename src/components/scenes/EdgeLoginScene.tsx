import type { EdgeLobby } from 'edge-core-js'
import * as React from 'react'
import {
  ActivityIndicator,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type TextStyle,
  View
} from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeCard } from '../cards/EdgeCard'
import { CrossFade } from '../common/CrossFade'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { WarningIcon } from '../icons/ThemedIcons'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { TitleText } from '../text/TitleText'
import { EdgeText } from '../themed/EdgeText'

export interface EdgeLoginParams {
  lobbyId: string
}

interface Props extends EdgeAppSceneProps<'edgeLogin'> {}

/** Gives the person time to read the warning before they can approve. */
const APPROVE_DELAY_SECONDS = 5

export const EdgeLoginScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { lobbyId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const [lobby, setLobby] = React.useState<EdgeLobby | undefined>(undefined)
  const [secondsLeft, setSecondsLeft] = React.useState(APPROVE_DELAY_SECONDS)
  const [warningSeen, setWarningSeen] = React.useState(false)

  // Where the end of the warning sits relative to the visible scroll area:
  const scrollRef = React.useRef<ScrollView>(null)
  const scrollMetrics = React.useRef({
    flashed: false,
    offset: 0,
    viewHeight: 0,
    warningBottom: 0
  })

  useAsyncEffect(
    async () => {
      try {
        setLobby(await account.fetchLobby(lobbyId))
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes('Account does not')
        ) {
          await showOkModal(
            lstrings.edge_login_failed,
            lstrings.edge_login_fail_stale_qr
          )
        } else {
          showError(error)
        }
        navigation.pop()
      }
    },
    [lobbyId],
    'EdgeLoginScene'
  )

  const checkWarningSeen = useHandler(() => {
    const metrics = scrollMetrics.current
    const { offset, viewHeight, warningBottom } = metrics
    if (warningSeen || viewHeight <= 0 || warningBottom <= 0) return
    if (offset + viewHeight >= warningBottom - 1) {
      setWarningSeen(true)
    } else if (!metrics.flashed) {
      // The scroll bar stays hidden until touched, so point at it once:
      metrics.flashed = true
      scrollRef.current?.flashScrollIndicators()
    }
  })

  const handleScrollLayout = useHandler((event: LayoutChangeEvent) => {
    scrollMetrics.current.viewHeight = event.nativeEvent.layout.height
    checkWarningSeen()
  })

  const handleScroll = useHandler(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollMetrics.current.offset = event.nativeEvent.contentOffset.y
      checkWarningSeen()
    }
  )

  // The warning only renders once the request loads, so a zero height means
  // there is nothing on screen to read yet:
  const handleWarningLayout = useHandler((event: LayoutChangeEvent) => {
    const { height, y } = event.nativeEvent.layout
    scrollMetrics.current.warningBottom = height > 0 ? y + height : 0
    checkWarningSeen()
  })

  // The countdown starts once the end of the warning has been on screen,
  // so large text on a small phone still gets the full time to read it:
  React.useEffect(() => {
    if (lobby == null || !warningSeen || secondsLeft <= 0) return
    const timeout = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1)
    }, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [lobby, secondsLeft, warningSeen])

  const handleAccept = useHandler(async () => {
    if (lobby?.loginRequest == null) return
    const { loginRequest } = lobby
    try {
      await loginRequest.approve()
      navigation.pop()
      await showOkModal(
        lstrings.send_scan_edge_login_success_title,
        lstrings.send_scan_edge_login_success_message
      )
    } catch (error: unknown) {
      navigation.pop()
      if (error instanceof Error && error.message.includes('Could not reach')) {
        await showOkModal(
          lstrings.edge_login_failed,
          lstrings.edge_login_fail_message
        )
      } else {
        showError(error)
      }
    }
  })

  const handleDecline = useHandler(() => {
    navigation.goBack()
  })
  const logoUri = theme.isDark
    ? lobby?.loginRequest?.displayImageDarkUrl
    : lobby?.loginRequest?.displayImageLightUrl

  return (
    <SceneWrapper>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onLayout={handleScrollLayout}
        onScroll={handleScroll}
      >
        <View style={styles.topArea}>
          <CrossFade activeKey={lobby == null ? 'loader' : 'logo'}>
            <View key="loader" style={styles.header}>
              <ActivityIndicator
                color={theme.iconTappable}
                size="large"
                accessibilityHint={lstrings.spinner_hint}
              />
            </View>
            <View key="logo" style={styles.header}>
              <Image
                style={styles.logo}
                source={{ uri: logoUri }}
                resizeMode="contain"
                accessibilityHint={lstrings.app_logo_hint}
              />
              <TitleText style={styles.appName}>
                {lobby?.loginRequest?.displayName}
              </TitleText>
            </View>
          </CrossFade>
        </View>
        <View testID="edgeLoginWarning" onLayout={handleWarningLayout}>
          <EdgeAnim
            enter={{ type: 'fadeIn', delay: 125 }}
            visible={lobby != null}
          >
            <EdgeCard gradientBackground={theme.cardGradientWarning}>
              <View style={styles.warning}>
                <View style={styles.warningTitleRow}>
                  <WarningIcon
                    color={theme.primaryText}
                    size={theme.rem(1.5)}
                  />
                  <ScalableText style={styles.warningTitle}>
                    {lstrings.edge_login_warning_title}
                  </ScalableText>
                </View>
                <ScalableText style={styles.warningText}>
                  {lstrings.edge_login_warning_irreversible}
                </ScalableText>
                <ScalableText style={styles.warningEmphasis}>
                  {lstrings.edge_login_warning_do_not_approve}
                </ScalableText>
              </View>
            </EdgeCard>
          </EdgeAnim>
        </View>
      </ScrollView>
      <View style={styles.buttons}>
        <EdgeAnim
          enter={{ type: 'fadeIn', delay: 250 }}
          visible={lobby != null}
        >
          <EdgeButton
            disabled={secondsLeft > 0}
            label={
              secondsLeft > 0
                ? sprintf(
                    lstrings.edge_login_grant_access_countdown_1s,
                    secondsLeft
                  )
                : lstrings.edge_login_grant_access_button
            }
            layout="column"
            onPress={handleAccept}
            type="destructive"
          />
        </EdgeAnim>
        <EdgeButton
          label={lstrings.string_deny}
          layout="column"
          onPress={handleDecline}
          type="secondary"
        />
      </View>
    </SceneWrapper>
  )
}

/**
 * Follows the OS text size, unlike the rest of the app, and wraps rather than
 * shrinks. A person who needs large text must still be able to read the warning.
 * The cap keeps the title on one line and, on larger phones, the whole warning
 * above the buttons.
 */
const ScalableText: React.FC<{
  children: string
  style: TextStyle
}> = props => (
  <EdgeText
    allowFontScaling
    disableFontScaling
    maxFontSizeMultiplier={1.75}
    numberOfLines={0}
    {...props}
  />
)

const showOkModal = async (
  title: string,
  message: string
): Promise<'ok' | undefined> => {
  return await Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      buttons={{ ok: { label: lstrings.string_ok } }}
      message={message + '\n'}
      title={title}
    />
  ))
}

const getStyles = cacheStyles((theme: Theme) => ({
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  // CrossFade children are absolutely positioned. This area sets their size:
  topArea: {
    flexGrow: 1,
    minHeight: theme.rem(7)
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1
  },
  logo: {
    alignSelf: 'stretch',
    flexGrow: 1,
    marginHorizontal: theme.rem(1),
    maxHeight: theme.rem(6)
  },
  appName: {
    padding: theme.rem(1)
  },
  warning: {
    gap: theme.rem(0.75),
    margin: theme.rem(0.5)
  },
  warningTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.rem(0.5)
  },
  warningTitle: {
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.25)
  },
  warningText: {
    fontSize: theme.rem(1)
  },
  warningEmphasis: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1)
  },
  buttons: {
    gap: theme.rem(0.5),
    margin: theme.rem(1)
  }
}))
