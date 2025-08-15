import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'

export interface RampPendingKycParams {
  onPendingCheck: () => Promise<boolean>
  stepOffThreshold?: number // in milliseconds, defaults to 60000 (1 minute)
}

interface Props extends EdgeAppSceneProps<'rampPendingKyc'> {}

export const RampPendingKycScene = (props: Props) => {
  const { navigation, route } = props
  const { onPendingCheck, stepOffThreshold = 60000 } = route.params

  const theme = useTheme()

  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasTimedOut, setHasTimedOut] = React.useState(false)

  const pollIntervalRef = React.useRef<number>(1000) // Start at 1 second
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const startTimeRef = React.useRef(Date.now())

  const checkPendingStatus = useHandler(async () => {
    try {
      const isComplete = await onPendingCheck()
      if (isComplete) {
        navigation.goBack()
      } else {
        // Check if we've exceeded the threshold
        if (Date.now() - startTimeRef.current > stepOffThreshold) {
          setIsLoading(false)
          setHasTimedOut(true)
        } else {
          // Step-off algorithm: double the interval each time, max 10 seconds
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, 10000)
          timeoutRef.current = setTimeout(
            checkPendingStatus,
            pollIntervalRef.current
          )
        }
      }
    } catch (err) {
      setError(String(err))
      setIsLoading(false)
    }
  })

  React.useEffect(() => {
    checkPendingStatus().catch(error => {
      showError(error)
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [checkPendingStatus])

  const handleClose = useHandler(() => {
    navigation.goBack()
  })

  return (
    <SceneWrapper>
      <SceneHeader title={lstrings.ramp_kyc_pending_title} withTopMargin />
      <ContentContainer>
        {error != null ? (
          <AlertCardUi4
            title={lstrings.ramp_kyc_error_title}
            body={error}
            type="error"
            marginRem={[1, 0.5]}
          />
        ) : (
          <>
            <CenterContainer>
              {isLoading && (
                <>
                  <StyledActivityIndicator
                    size="large"
                    color={theme.primaryText}
                  />
                  <Paragraph center>
                    {lstrings.ramp_kyc_pending_message}
                  </Paragraph>
                </>
              )}
              {hasTimedOut && (
                <Paragraph center>
                  {lstrings.ramp_kyc_timeout_message}
                </Paragraph>
              )}
            </CenterContainer>
          </>
        )}
      </ContentContainer>
      {(error != null || hasTimedOut) && (
        <SceneButtons
          primary={{
            label: lstrings.string_cancel_cap,
            onPress: handleClose
          }}
        />
      )}
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
