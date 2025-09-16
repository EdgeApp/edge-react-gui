import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
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
  message?: string
}

interface Props extends EdgeAppSceneProps<'rampPending'> {}

export const RampPendingScene = (props: Props): React.JSX.Element => {
  const { route } = props
  const { title, initialStatus, onStatusCheck, onClose } = route.params

  const theme = useTheme()

  const [status, setStatus] =
    React.useState<RampPendingSceneStatus>(initialStatus)
  const [error, setError] = React.useState<unknown>()

  const pollIntervalRef = React.useRef<number>(1000) // Start at 1 second
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const checkStatus = useHandler(async () => {
    try {
      const status = await onStatusCheck()
      setStatus(status)
      if (status.isChecking) {
        // Step-off algorithm: double the interval each time, max 10 seconds
        pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, 10000)
        timeoutRef.current = setTimeout(() => {
          checkStatus().catch(showError)
        }, pollIntervalRef.current)
      }
    } catch (err) {
      showError(err)
      setError(err)
      setStatus({
        isChecking: false
      })
    }
  })

  React.useEffect(() => {
    checkStatus().catch(showError)

    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [checkStatus])

  const handleClose = useHandler(() => {
    onClose()
  })

  return (
    <SceneWrapper>
      <SceneContainer expand headerTitle={title}>
        <ContentContainer>
          {error != null ? (
            <ErrorCard error={error} />
          ) : (
            <CenterContainer>
              {status.isChecking && (
                <StyledActivityIndicator
                  size="large"
                  color={theme.primaryText}
                />
              )}
              {status.message != null ? (
                <Paragraph center>{status.message}</Paragraph>
              ) : null}
            </CenterContainer>
          )}
        </ContentContainer>
        {!status.isChecking && (
          <SceneButtons
            primary={{
              label: lstrings.string_close_cap,
              onPress: handleClose
            }}
          />
        )}
      </SceneContainer>
    </SceneWrapper>
  )
}

// Styled components
const ContentContainer = styled(View)(theme => ({
  flex: 1,
  paddingHorizontal: theme.rem(0.5)
}))

const CenterContainer = styled(View)(theme => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: theme.rem(1)
}))

const StyledActivityIndicator = styled(ActivityIndicator)(theme => ({
  marginBottom: theme.rem(2)
}))
