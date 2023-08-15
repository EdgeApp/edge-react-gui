import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props extends EdgeSceneProps<'exchangeQuoteProcessing'> {}

export function CryptoExchangeQuoteProcessingScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route } = props
  const { fetchSwapQuotePromise, onCancel, onDone, onError } = route.params

  const [isLongWait, setIsLongWait] = React.useState(false)

  const mounted = React.useRef<boolean>(true)

  // Set text to 'Locating a swap is taking longer than usual' if we have been
  // waiting for 20 seconds
  React.useEffect(() => {
    setTimeout(() => {
      if (!mounted.current) return
      setIsLongWait(true)
    }, 20000)

    return () => {
      mounted.current = false
    }
  }, [])

  useAsyncEffect(async () => {
    try {
      const swapinfo = await fetchSwapQuotePromise
      if (mounted.current) onDone(swapinfo)
    } catch (e: any) {
      await onError(e)
    }

    return () => {
      mounted.current = false
    }
  }, [onDone, onError])

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <View style={styles.container}>
        <EdgeText style={styles.title}>{lstrings.hang_tight}</EdgeText>
        <EdgeText style={styles.findingText} numberOfLines={3}>
          {isLongWait ? lstrings.exchange_slow : lstrings.trying_to_find}
        </EdgeText>
        <ActivityIndicator style={styles.spinner} color={theme.iconTappable} />
      </View>
      {!isLongWait ? null : (
        <ButtonsContainer
          absolute
          fade
          primary={{
            label: lstrings.string_cancel_cap,
            onPress: () => {
              mounted.current = false
              onCancel()
            }
          }}
          layout="column"
        />
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
    fontSize: theme.rem(1.25),
    marginBottom: theme.rem(1.25)
  },
  findingText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(0.75)
  }
}))
