import type { RampPendingSceneStatus } from '../../../../components/scenes/RampPendingScene'
import { lstrings } from '../../../../locales/strings'
import { openEdgeWebView } from '../../../../util/webViewUtils'
import { Exit } from '../../utils/workflows'
import type { InfiniteTosStatus } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

export const tosWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation } = utils
  const authState = infiniteApi.getAuthState()

  // Ensure we have a customer ID
  const customerId = authState.customerId
  if (customerId == null) {
    throw new Exit('Customer ID is missing')
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
      openEdgeWebView({
        navigation,
        url: tosResponse.tosUrl,
        onClose: () => {
          resolve()
          return true // Allow close
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      const startTime = Date.now()
      const stepOffThreshold = 60000 // 1 minute

      // Navigate to pending scene to check status
      navigation.replace('rampPending', {
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

          if (updatedTos.status === 'accepted') {
            resolve()
          }
          return tosStatusToSceneStatus(updatedTos.status)
        },
        onClose: () => {
          navigation.goBack()
          reject(new Exit('Terms of Service not accepted'))
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
