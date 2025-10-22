import type { RampPendingSceneStatus } from '../../../../components/scenes/RampPendingScene'
import { lstrings } from '../../../../locales/strings'
import { ExitError } from '../../utils/exitUtils'
import { openWebView } from '../../utils/webViewUtils'
import type { InfiniteApi, InfiniteTosStatus } from '../infiniteApiTypes'
import type { NavigationFlow } from '../utils/navigationFlow'

interface Params {
  infiniteApi: InfiniteApi
  navigationFlow: NavigationFlow
}

export const tosWorkflow = async (params: Params): Promise<void> => {
  const { infiniteApi, navigationFlow } = params
  const authState = infiniteApi.getAuthState()

  // Ensure we have a customer ID
  const customerId = authState.customerId
  if (customerId == null) {
    throw new ExitError('Customer ID is missing')
  }

  // Get TOS status
  const tosResponse = await infiniteApi.getTos(customerId)

  // If TOS is already accepted or not required, skip
  if (
    tosResponse.status === 'accepted' ||
    tosResponse.status === 'not_required'
  ) {
    return
  }

  // Show TOS in webview if pending
  if (tosResponse.status === 'pending' && tosResponse.tosUrl !== '') {
    await new Promise<void>((resolve, reject) => {
      openWebView({
        url: tosResponse.tosUrl,
        onClose: () => {
          resolve()
          return true // Allow close
        }
      }).catch(reject)
    })

    await new Promise<void>((resolve, reject) => {
      const startTime = Date.now()
      const stepOffThreshold = 60000 // 1 minute

      // Navigate to pending scene to check status
      navigationFlow.navigate('rampPending', {
        title: lstrings.ramp_tos_pending_title,
        initialStatus: tosStatusToSceneStatus('pending'),
        onStatusCheck: async () => {
          // Check if we've exceeded the timeout threshold
          if (Date.now() - startTime > stepOffThreshold) {
            return {
              isChecking: false,
              message: lstrings.ramp_tos_timeout_message
            }
          }

          const updatedTos = await infiniteApi.getTos(customerId)

          if (
            updatedTos.status === 'accepted' ||
            updatedTos.status === 'not_required'
          ) {
            resolve()
          }
          return tosStatusToSceneStatus(updatedTos.status)
        },
        onClose: () => {
          navigationFlow.goBack()
          reject(new ExitError('Terms of Service not accepted'))
        }
      })
    })
  }
}

// Helper function to convert TOS status to scene status
const tosStatusToSceneStatus = (
  status: InfiniteTosStatus
): RampPendingSceneStatus => {
  switch (status) {
    case 'accepted':
      return {
        isChecking: false,
        message: lstrings.ramp_tos_status_accepted
      }
    case 'pending':
      return {
        isChecking: true,
        message: lstrings.ramp_tos_pending_message
      }
    case 'not_required':
      return {
        isChecking: false,
        message: lstrings.ramp_tos_status_not_required
      }
  }
}
