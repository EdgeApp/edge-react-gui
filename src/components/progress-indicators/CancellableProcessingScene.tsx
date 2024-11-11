import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props<T> {
  animationDuration?: number
  navigation: NavigationBase

  doWork: () => Promise<T>
  onCancel: () => void
  onDone: (res: T) => void
  onError: (navigation: NavigationBase, error: unknown) => Promise<void>

  processingText: string
  longProcessingText?: string
  longProcessingTime?: number
}

export function CancellableProcessingScene<T>(props: Props<T>) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const {
    animationDuration = 5000,
    navigation,
    onCancel,
    onDone,
    onError,
    doWork,
    processingText,
    longProcessingText = processingText,
    longProcessingTime = 10000
  } = props

  const [isLongWait, setIsLongWait] = React.useState(false)
  const mounted = React.useRef<boolean>(true)

  React.useEffect(() => {
    setTimeout(() => {
      if (!mounted.current) return
      setIsLongWait(true)
    }, longProcessingTime)

    return () => {
      mounted.current = false
    }
  }, [longProcessingTime])

  useAsyncEffect(
    async () => {
      try {
        const result = await doWork()
        if (mounted.current) onDone(result)
      } catch (error: unknown) {
        await onError(navigation, error)
      }

      return () => {
        mounted.current = false
      }
    },
    [doWork, onCancel, onError],
    'CancellableProcessingScene'
  )

  return (
    <SceneWrapper>
      <View style={styles.outerContainer}>
        <View style={styles.container}>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 90, duration: animationDuration }}>
            <EdgeText style={styles.title}>{lstrings.hang_tight}</EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 60, duration: animationDuration }}>
            <EdgeText style={styles.findingText} numberOfLines={3}>
              {isLongWait ? longProcessingText : processingText}
            </EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInDown', distance: 90, duration: animationDuration }}>
            <ActivityIndicator size="large" style={styles.spinner} color={theme.iconTappable} />
          </EdgeAnim>
        </View>
        {!isLongWait ? null : (
          <EdgeAnim style={styles.button} enter={{ type: 'fadeInDown', distance: 90 }}>
            <ButtonsView
              absolute
              primary={{
                label: lstrings.string_cancel_cap,
                onPress: () => {
                  mounted.current = false
                  onCancel()
                }
              }}
              layout="column"
              parentType="scene"
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
