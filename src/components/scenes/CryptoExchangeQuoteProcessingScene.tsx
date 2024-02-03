import { EdgeSwapQuote } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

export interface ExchangeQuoteProcessingParams {
  fetchSwapQuotesPromise: Promise<EdgeSwapQuote[]>
  onCancel: () => void
  onError: (error: any) => Promise<void>
  onDone: (quotes: EdgeSwapQuote[]) => void
}

interface Props extends EdgeSceneProps<'exchangeQuoteProcessing'> {}

const ANIM_DURATION = 5000

export function CryptoExchangeQuoteProcessingScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route } = props
  const { fetchSwapQuotesPromise, onCancel, onDone, onError } = route.params

  const [isLongWait, setIsLongWait] = React.useState(false)

  const mounted = React.useRef<boolean>(true)

  // Set text to 'Locating a swap is taking longer than usual' if we have been
  // waiting for 20 seconds
  React.useEffect(() => {
    setTimeout(() => {
      if (!mounted.current) return
      setIsLongWait(true)
    }, 10000)

    return () => {
      mounted.current = false
    }
  }, [])

  useAsyncEffect(
    async () => {
      try {
        const quotes = await fetchSwapQuotesPromise
        if (mounted.current) onDone(quotes)
      } catch (e: any) {
        await onError(e)
      }

      return () => {
        mounted.current = false
      }
    },
    [onDone, onError],
    'CryptoExchangeQuoteProcessingScene'
  )

  return (
    <SceneWrapper>
      <View style={styles.outerContainer}>
        <View style={styles.container}>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 90, duration: ANIM_DURATION }}>
            <EdgeText style={styles.title}>{lstrings.hang_tight}</EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 60, duration: ANIM_DURATION }}>
            <EdgeText style={styles.findingText} numberOfLines={3}>
              {isLongWait ? lstrings.exchange_slow : lstrings.trying_to_find}
            </EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInDown', distance: 90, duration: ANIM_DURATION }}>
            <ActivityIndicator size="large" style={styles.spinner} color={theme.iconTappable} />
          </EdgeAnim>
        </View>
        {!isLongWait ? null : (
          <EdgeAnim style={styles.button} enter={{ type: 'fadeInDown', distance: 90 }}>
            <ButtonsViewUi4
              absolute
              primary={{
                label: lstrings.string_cancel_cap,
                onPress: () => {
                  mounted.current = false
                  onCancel()
                }
              }}
              layout="column"
              sceneMargin
            />
          </EdgeAnim>
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  outerContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    marginTop: theme.rem(3)
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1.5),
    marginBottom: theme.rem(1.25)
  },
  findingText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1)
  },
  button: {
    marginVertical: theme.rem(1)
  }
}))
