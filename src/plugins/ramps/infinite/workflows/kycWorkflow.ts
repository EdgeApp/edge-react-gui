import type { RampPendingKycSceneStatus } from '../../../../components/scenes/RampPendingKycScene'
import { lstrings } from '../../../../locales/strings'
import type { EmailContactInfo } from '../../../../types/FormTypes'
import { openEdgeWebView } from '../../../../util/webViewUtils'
import { rampDeeplinkManager } from '../../rampDeeplinkHandler'
import { Exit } from '../../utils/workflows'
import type { InfiniteKycStatus } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

// Exports
export const kycWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, pluginId, state, workflowState } = utils
  const authState = infiniteApi.getAuthState()

  // Mark workflow as started
  workflowState.kyc.status = 'started'

  if (!authState.onboarded) {
    workflowState.kyc.sceneShown = true
    const userSubmittedKycForm = await new Promise<boolean>(
      (resolve, reject) => {
        navigation.navigate('kycForm', {
          headerTitle: lstrings.ramp_plugin_kyc_title,
          onSubmit: async (contactInfo: EmailContactInfo) => {
            try {
              // Create customer profile
              const customerResponse = await infiniteApi.createCustomer({
                type: 'individual',
                countryCode: 'US',
                data: {
                  personalInfo: {
                    firstName: contactInfo.firstName,
                    lastName: contactInfo.lastName
                  },
                  companyInformation: undefined,
                  contactInformation: {
                    email: contactInfo.email
                  }
                }
              })

              // Store customer ID directly in state
              state.customerId = customerResponse.customer.id

              // Register deeplink handler (fast-path for successful completion)
              let shouldNavigateBack = false
              rampDeeplinkManager.register('buy', pluginId, _link => {
                // KYC completed, mark flag and resolve
                shouldNavigateBack = true
                resolve(true)
              })

              // Inject deeplink callback into KYC URL
              const kycUrl = new URL(customerResponse.kycLinkUrl)
              const callbackUrl = `https://deep.edge.app/ramp/buy/${pluginId}`
              kycUrl.searchParams.set('callback', callbackUrl)

              // Open KYC webview with close detection
              openEdgeWebView({
                navigation,
                url: kycUrl.toString(),
                onClose: () => {
                  // If deeplink was triggered, navigation.goBack() will be called automatically
                  // Otherwise, user closed webview - continue to pending KYC scene
                  if (shouldNavigateBack) {
                    navigation.goBack()
                  }
                  resolve(true)
                  return true // Allow close
                }
              })
            } catch (error: any) {
              reject(error)
            }
          },
          onClose: () => {
            resolve(false)
          }
        })
      }
    )

    // User must have cancelled KYC
    if (!userSubmittedKycForm) {
      workflowState.kyc.status = 'cancelled'
      throw new Exit('User cancelled KYC')
    }
  }

  if (state.customerId == null) {
    workflowState.kyc.status = 'cancelled'
    throw new Exit('Customer ID is missing')
  }

  const initialKycStatus = await infiniteApi.getKycStatus(state.customerId)
  // Skip if KYC status scene if already approved
  if (initialKycStatus.kycStatus === 'approved') {
    workflowState.kyc.status = 'completed'
    return
  }

  // Mark that we're showing the KYC verification scene
  workflowState.kyc.sceneShown = true

  await new Promise<void>((resolve, reject) => {
    navigation.navigate('rampPendingKyc', {
      initialStatus: kycStatusToSceneStatus(initialKycStatus.kycStatus),
      onStatusCheck: async () => {
        if (authState.customerId == null) {
          throw new Error('Customer ID is missing')
        }
        const statusResponse = await infiniteApi
          .getKycStatus(authState.customerId)
          .catch((error: unknown) => {
            // Add extra log for trace
            console.error('Error checking KYC status:', error)
            throw error
          })

        if (statusResponse.kycStatus === 'approved') {
          // KYC is approved, continue workflow
          // The next scene will use navigation.replace to replace this verification scene
          resolve()
        } else if (
          statusResponse.kycStatus === 'rejected' ||
          statusResponse.kycStatus === 'paused' ||
          statusResponse.kycStatus === 'offboarded'
        ) {
          // KYC is rejected, paused, or offboarded, exit workflow
          workflowState.kyc.status = 'cancelled'
          reject(new Exit('KYC not approved'))
        }

        return kycStatusToSceneStatus(statusResponse.kycStatus)
      },
      onClose: () => {
        workflowState.kyc.status = 'cancelled'
        reject(new Exit('User closed KYC status screen'))
      }
    })
  })

  // KYC workflow completed successfully
  workflowState.kyc.status = 'completed'
}

// Non-exported helper functions
const kycStatusToSceneStatus = (
  kycStatus: InfiniteKycStatus
): RampPendingKycSceneStatus => {
  switch (kycStatus) {
    case 'not_started':
    case 'incomplete':
    case 'awaiting_ubo':
    case 'under_review':
      // KYC is still pending, continue polling
      return {
        isPending: true,
        message: lstrings.ramp_kyc_pending_message
      }
    case 'approved':
      // KYC is approved, stop polling
      return {
        isPending: false,
        message: lstrings.ramp_kyc_approved_message
      }
    case 'rejected':
    case 'paused':
    case 'offboarded':
      return {
        isPending: false,
        error: lstrings.ramp_kyc_rejected
      }
  }
}
