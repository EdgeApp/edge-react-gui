import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'

export interface RampPendingParams {
  /**
   * The title to display in the scene header
   */
  title: string
  /**
   * Initial status to display when the scene first renders
   */
  initialStatus: RampPendingSceneStatus
  /**
   * Async function called periodically to check the current status.
   * Should return the current status including any error or completion state.
   */
  onStatusCheck: () => Promise<RampPendingSceneStatus>
  /**
   * Callback invoked when the user navigates away from the scene.
   */
  onCancel: () => void
  /**
   * Callback invoked when the user closes the scene
   */
  onClose: () => void
}

export interface RampPendingSceneStatus {
  /**
   * Whether the operation is still in progress and checking should continue
   */
  isChecking: boolean
  /**
   * Optional status message to display to the user
   */
  message: string
}

interface Props extends EdgeAppSceneProps<'rampPending'> {}

export const RampPendingScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { title, initialStatus, onStatusCheck, onCancel, onClose } =
    route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const [status, setStatus] =
    React.useState<RampPendingSceneStatus>(initialStatus)
  const [error, setError] = React.useState<unknown>()

  // This needs component state so that useEffect updates don't reset it
  const pollIntervalRef = React.useRef<number>(1000) // Start at 1 second

  React.useEffect(() => {
    // Reset poll interval on dependency change
    pollIntervalRef.current = 1000
    const task = makePeriodicTask(
      async () => {
        const nextStatus = await onStatusCheck()
        setStatus(nextStatus)
        if (!nextStatus.isChecking) {
          task.stop()
        } else {
          // Step-off algorithm: double interval each time, max 10 seconds
          const nextGap = Math.min(pollIntervalRef.current * 2, 10000)
          pollIntervalRef.current = nextGap
          task.setDelay(nextGap)
        }
      },
      pollIntervalRef.current,
      {
        onError: (error: unknown) => {
          setError(error)
          setStatus({
            isChecking: false,
            message: lstrings.unknown_error_message
          })
        }
      }
    )

    task.start()
    return () => {
      task.stop()
    }
  }, [onStatusCheck])

  // Handle back navigation
  useBackEvent(navigation, onCancel)

  const handleClose = useHandler(() => {
    onClose()
  })

  return (
    <SceneWrapper hasTabs>
      <SceneContainer headerTitle={title}>
        <View style={styles.contentContainer}>
          {error != null ? (
            <ErrorCard error={error} />
          ) : (
            <View style={styles.centerContainer}>
              {status.isChecking && (
                <ActivityIndicator
                  style={styles.activityIndicator}
                  size="large"
                  color={theme.primaryText}
                />
              )}
              {status.message != null ? (
                <Paragraph center>{status.message}</Paragraph>
              ) : null}
            </View>
          )}
          {!status.isChecking && (
            <SceneButtons
              primary={{
                label: lstrings.string_close_cap,
                onPress: handleClose
              }}
            />
          )}
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.rem(0.5)
  },
  centerContainer: {
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  activityIndicator: {
    marginBottom: theme.rem(2)
  }
}))
