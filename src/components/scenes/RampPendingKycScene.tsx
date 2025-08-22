import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'

export interface RampPendingKycParams {
  initialStatus: RampPendingKycSceneStatus
  onStatusCheck: () => Promise<RampPendingKycSceneStatus>
  onClose: () => void
  stepOffThreshold?: number // in milliseconds, defaults to 60000 (1 minute)
}

export interface RampPendingKycSceneStatus {
  isPending: boolean
  message?: string
  error?: string
}

interface Props extends EdgeAppSceneProps<'rampPendingKyc'> {}

export const RampPendingKycScene = (props: Props) => {
  const { route } = props
  const {
    initialStatus,
    onStatusCheck,
    onClose,
    stepOffThreshold = 60000
  } = route.params

  const theme = useTheme()

  const [status, setStatus] =
    React.useState<RampPendingKycSceneStatus>(initialStatus)

  const pollIntervalRef = React.useRef<number>(1000) // Start at 1 second
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const startTimeRef = React.useRef(Date.now())

  const checkStatus = useHandler(async () => {
    try {
      const status = await onStatusCheck()
      setStatus(status)
      if (status.isPending) {
        // Check if we've exceeded the threshold
        if (Date.now() - startTimeRef.current > stepOffThreshold) {
          setStatus({
            isPending: false,
            message: lstrings.ramp_kyc_timeout_message
          })
        } else {
          // Step-off algorithm: double the interval each time, max 10 seconds
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, 10000)
          timeoutRef.current = setTimeout(checkStatus, pollIntervalRef.current)
        }
      }
    } catch (err) {
      showError(err)
      setStatus({
        isPending: false,
        error: lstrings.unknown_error_message
      })
    }
  })

  React.useEffect(() => {
    checkStatus().catch(error => {
      showError(error)
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [checkStatus])

  const handleClose = useHandler(() => {
    onClose()
  })

  return (
    <SceneWrapper>
      <SceneContainer expand headerTitle={lstrings.ramp_kyc_pending_title}>
        <ContentContainer>
          {status.error != null ? (
            <AlertCardUi4
              title={lstrings.ramp_kyc_error_title}
              body={status.error}
              type="error"
              marginRem={[1, 0.5]}
            />
          ) : (
            <CenterContainer>
              {status.isPending && (
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
        {!status.isPending && (
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
