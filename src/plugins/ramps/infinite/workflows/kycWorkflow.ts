import { Platform } from 'react-native'
import SafariView from 'react-native-safari-view'

import type { RampPendingKycSceneStatus } from '../../../../components/scenes/RampPendingKycScene'
import { lstrings } from '../../../../locales/strings'
import type { EmailContactInfo } from '../../../../types/FormTypes'
import { rampDeeplinkManager } from '../../rampDeeplinkHandler'
import { Exit } from '../../utils/workflows'
import type { InfiniteKycStatus } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

// Exports
export const kycWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, openWebView, pluginId, state } = utils
  const authState = infiniteApi.getAuthState()

  if (!authState.onboarded) {
    const kycResult = await new Promise<boolean>((resolve, reject) => {
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

            // Register deeplink handler
            rampDeeplinkManager.register('buy', pluginId, _link => {
              // KYC completed, close webview and continue
              if (Platform.OS === 'ios') {
                SafariView.dismiss()
              }
              resolve(true)
            })

            // Inject deeplink callback into KYC URL
            const kycUrl = new URL(customerResponse.kycLinkUrl)
            const callbackUrl = `https://deep.edge.app/ramp/buy/${pluginId}`
            kycUrl.searchParams.set('callback', callbackUrl)

            // Open KYC webview with modified URL
            await openWebView(kycUrl.toString())
          } catch (error: any) {
            reject(error)
          }
        },
        onClose: () => {
          resolve(false)
        }
      })
    })

    // User must have cancelled KYC
    if (!kycResult) {
      throw new Exit('User cancelled KYC')
    }
  }

  if (authState.customerId == null) {
    throw new Exit('Customer ID is missing')
  }

  const initialKycStatus = await infiniteApi.getKycStatus(authState.customerId)
  // Skip if KYC status scene if already approved
  if (initialKycStatus.kycStatus === 'approved') {
    return
  }

  // Mark that we're showing the KYC verification scene
  state.kycSceneShown = true

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
          reject(new Exit('KYC not approved'))
        }

        return kycStatusToSceneStatus(statusResponse.kycStatus)
      },
      onClose: () => {
        reject(new Exit('User closed KYC status screen'))
      }
    })
  })
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
