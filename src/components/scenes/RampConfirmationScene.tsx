import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeCard } from '../cards/EdgeCard'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SafeSlider } from '../themed/SafeSlider'

export interface RampConfirmationParams {
  direction: 'buy' | 'sell'
  source: {
    amount: string
    currencyCode: string
  }
  target: {
    amount: string
    currencyCode: string
  }
  /**
   * Callback invoked when the user navigates away from the scene.
   */
  onCancel: () => void
  onConfirm: () => Promise<void>
}

interface Props extends EdgeAppSceneProps<'rampConfirmation'> {}

export const RampConfirmationScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { direction, source, target, onCancel, onConfirm } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const [error, setError] = React.useState<unknown>(null)
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleSlideComplete = useHandler(async (reset: () => void) => {
    setError(null)
    setIsConfirming(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(err)
      reset() // Reset the slider on error
    } finally {
      setIsConfirming(false)
    }
  })

  // Handle back navigation
  useBackEvent(navigation, onCancel)

  const title =
    direction === 'buy'
      ? sprintf(lstrings.buy_1s, target.currencyCode)
      : sprintf(lstrings.sell_1s, source.currencyCode)

  return (
    <SceneWrapper hasTabs>
      <SceneContainer headerTitle={title}>
        <EdgeCard sections>
          <EdgeRow
            title={lstrings.string_amount}
            body={`${source.amount} ${source.currencyCode}`}
          />
          <EdgeRow
            title={lstrings.quote_payout_amount}
            body={`${target.amount} ${target.currencyCode}`}
          />
        </EdgeCard>

        {error != null && <ErrorCard error={error} />}

        <View style={styles.sliderContainer}>
          <SafeSlider
            disabled={isConfirming}
            onSlidingComplete={handleSlideComplete}
          />
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sliderContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.rem(1)
  }
}))
