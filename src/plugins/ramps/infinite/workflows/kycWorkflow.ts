import { I18nError } from '../../../../components/cards/ErrorCard'
import type { RampPendingSceneStatus } from '../../../../components/scenes/RampPendingScene'
import { lstrings } from '../../../../locales/strings'
import type { KycContactInfo } from '../../../../types/FormTypes'
import { openEdgeWebView } from '../../../../util/webViewUtils'
import { rampDeeplinkManager } from '../../rampDeeplinkHandler'
import { Exit } from '../../utils/workflows'
import type { InfiniteKycStatus } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

// Exports
export const kycWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, pluginId, workflowState } = utils

  let customerId = infiniteApi.getAuthState().customerId

  // Mark workflow as started
  workflowState.kyc.status = 'started'

  // If we have a customer ID, check KYC status first
  if (customerId != null) {
    const kycStatus = await infiniteApi.getKycStatus(customerId)

    // If already approved, we're done - no scene shown
    if (kycStatus.kycStatus === 'approved') {
      workflowState.kyc.status = 'completed'
      return
    }

    // If not_started or incomplete, show KYC form
    if (
      kycStatus.kycStatus === 'not_started' ||
      kycStatus.kycStatus === 'incomplete'
    ) {
      // Fall through to show KYC form
    } else {
      // For all other statuses (under_review, awaiting_ubo, etc.), show pending scene
      await showKycPendingScene(
        navigation,
        workflowState,
        infiniteApi,
        customerId,
        kycStatus.kycStatus
      )
      workflowState.kyc.status = 'completed'
      return
    }
  }

  // Show KYC form for new customers or those with not_started/incomplete status
  {
    workflowState.kyc.sceneShown = true
    const userSubmittedKycForm = await new Promise<boolean>(
      (resolve, reject) => {
        navigation.navigate('kycForm', {
          headerTitle: lstrings.ramp_plugin_kyc_title,
          onSubmit: async (contactInfo: KycContactInfo) => {
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
                  },
                  residentialAddress: {
                    streetLine1: contactInfo.address,
                    city: contactInfo.city,
                    state: contactInfo.state,
                    postalCode: contactInfo.postalCode
                  }
                }
              })

              // Store customer ID directly in state
              infiniteApi.saveCustomerId(customerResponse.customer.id)

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

  customerId = infiniteApi.getAuthState().customerId

  // After KYC form submission, check if we need to show pending scene
  if (customerId == null) {
    workflowState.kyc.status = 'cancelled'
    throw new Exit('Customer ID is missing')
  }

  // Get current KYC status after form submission
  const currentKycStatus = await infiniteApi.getKycStatus(customerId)

  // If already approved after form submission, we're done
  if (currentKycStatus.kycStatus === 'approved') {
    workflowState.kyc.status = 'completed'
    return
  }

  // Show pending scene for non-approved statuses
  await showKycPendingScene(
    navigation,
    workflowState,
    infiniteApi,
    customerId,
    currentKycStatus.kycStatus
  )

  // KYC workflow completed successfully
  workflowState.kyc.status = 'completed'
}

// Helper function to show KYC pending scene
const showKycPendingScene = async (
  navigation: any,
  workflowState: any,
  infiniteApi: any,
  customerId: string,
  initialStatus: InfiniteKycStatus
): Promise<void> => {
  // Mark that we're showing the KYC verification scene
  workflowState.kyc.sceneShown = true

  await new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    const stepOffThreshold = 60000 // 1 minute

    navigation.navigate('rampPending', {
      title: lstrings.ramp_kyc_pending_title,
      initialStatus: kycStatusToSceneStatus(initialStatus),
      onStatusCheck: async () => {
        // Check if we've exceeded the timeout threshold
        if (Date.now() - startTime > stepOffThreshold) {
          return {
            isChecking: false,
            message: lstrings.ramp_kyc_timeout_message
          }
        }

        const statusResponse = await infiniteApi.getKycStatus(customerId)

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

        // This will throw if status is rejected/paused/offboarded
        return kycStatusToSceneStatus(statusResponse.kycStatus)
      },
      onClose: () => {
        workflowState.kyc.status = 'cancelled'
        reject(new Exit('User closed KYC status screen'))
      }
    })
  })
}

// Non-exported helper functions
const kycStatusToSceneStatus = (
  kycStatus: InfiniteKycStatus
): RampPendingSceneStatus => {
  switch (kycStatus) {
    case 'not_started':
    case 'incomplete':
    case 'awaiting_ubo':
    case 'under_review':
      // KYC is still pending, continue polling
      return {
        isChecking: true,
        message: lstrings.ramp_kyc_pending_message
      }
    case 'approved':
      // KYC is approved, stop polling
      return {
        isChecking: false,
        message: lstrings.ramp_kyc_approved_message
      }
    case 'rejected':
    case 'paused':
    case 'offboarded':
      // Throw error instead of returning it
      throw new I18nError(
        lstrings.ramp_kyc_error_title,
        lstrings.ramp_kyc_rejected
      )
  }
}
