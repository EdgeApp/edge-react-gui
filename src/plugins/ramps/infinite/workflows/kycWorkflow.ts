import { I18nError } from '../../../../components/cards/ErrorCard'
import type { KycFormData } from '../../../../components/scenes/RampKycFormScene'
import type { RampPendingSceneStatus } from '../../../../components/scenes/RampPendingScene'
import { lstrings } from '../../../../locales/strings'
import type { EdgeVault } from '../../../../util/vault/edgeVault'
import { ExitError } from '../../utils/exitUtils'
import {
  type InfiniteApi,
  InfiniteApiError,
  type InfiniteKycStatus
} from '../infiniteApiTypes'
import type { NavigationFlow } from '../utils/navigationFlow'

interface Params {
  infiniteApi: InfiniteApi
  navigationFlow: NavigationFlow
  pluginId: string
  vault: EdgeVault
}

// Exports
export const kycWorkflow = async (params: Params): Promise<void> => {
  const { infiniteApi, navigationFlow, pluginId, vault } = params

  let customerId = infiniteApi.getAuthState().customerId

  // If we have a customer ID, check KYC status first
  if (customerId != null) {
    const kycStatus = await infiniteApi.getKycStatus(customerId)

    // If already approved (ACTIVE), we're done - no scene shown
    if (kycStatus.kycStatus === 'ACTIVE') {
      return
    }

    // Determine the status to use for the pending scene
    let statusForPendingScene: InfiniteKycStatus = kycStatus.kycStatus

    // If PENDING, redirect directly to KYC webview (skip form since customer exists)
    if (kycStatus.kycStatus === 'PENDING') {
      await openKycWebView(navigationFlow, infiniteApi, customerId, pluginId)

      // Check status after webview closes
      const currentKycStatus = await infiniteApi.getKycStatus(customerId)
      if (currentKycStatus.kycStatus === 'ACTIVE') {
        return
      }
      statusForPendingScene = currentKycStatus.kycStatus
    }

    // Show pending scene for non-ACTIVE statuses
    await showKycPendingScene(
      navigationFlow,
      infiniteApi,
      customerId,
      statusForPendingScene
    )
    return
  }

  // Show KYC form for new customers or those with PENDING status

  const userSubmittedKycForm = await new Promise<boolean>((resolve, reject) => {
    navigationFlow.navigate('kycForm', {
      headerTitle: lstrings.ramp_plugin_kyc_title,
      onSubmit: async (contactInfo: KycFormData) => {
        try {
          // Create customer profile with flattened schema
          const customerResponse = await infiniteApi
            .createCustomer({
              type: 'individual',
              countryCode: 'US',
              contactInformation: {
                email: contactInfo.email
              },
              personalInfo: {
                firstName: contactInfo.firstName,
                lastName: contactInfo.lastName
              },
              companyInformation: undefined
            })
            .catch((error: unknown) => {
              return { error }
            })

          if ('error' in customerResponse) {
            if (
              customerResponse.error instanceof InfiniteApiError &&
              customerResponse.error.detail.includes('duplicate_record')
            ) {
              throw new I18nError(
                lstrings.ramp_signup_failed_title,
                lstrings.ramp_signup_failed_account_existsmessage
              )
            }

            throw customerResponse.error
          }

          // Store customer ID directly in state
          infiniteApi.saveCustomerId(customerResponse.customer.id)

          // Save or update personal info in vault
          const personalInfoUuid = await vault.getUuid('personalInfo', 0)
          const personalInfo = {
            type: 'personalInfo' as const,
            name: {
              firstName: contactInfo.firstName,
              lastName: contactInfo.lastName
            },
            email: contactInfo.email
          }
          if (personalInfoUuid != null) {
            await vault.updatePersonalInfo(personalInfoUuid, personalInfo)
          } else {
            await vault.createPersonalInfo(personalInfo)
          }

          // Save or update address info in vault
          const addressInfoUuid = await vault.getUuid('addressInfo', 0)
          const addressInfo = {
            type: 'addressInfo' as const,
            line1: contactInfo.address1,
            line2: contactInfo.address2,
            city: contactInfo.city,
            state: contactInfo.state,
            postalCode: contactInfo.postalCode,
            countryCode: 'US'
          }
          if (addressInfoUuid != null) {
            await vault.updateAddressInfo(addressInfoUuid, addressInfo)
          } else {
            await vault.createAddressInfo(addressInfo)
          }

          // Open KYC webview
          await openKycWebView(
            navigationFlow,
            infiniteApi,
            customerResponse.customer.id,
            pluginId
          )
          resolve(true)
        } catch (err) {
          reject(new ExitError('KYC failed'))
          throw err
        }
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })

  // User must have cancelled KYC
  if (!userSubmittedKycForm) {
    throw new ExitError('User cancelled KYC')
  }

  customerId = infiniteApi.getAuthState().customerId

  // After KYC form submission, check if we need to show pending scene
  if (customerId == null) {
    throw new ExitError('Customer ID is missing')
  }

  // Get current KYC status after form submission
  const currentKycStatus = await infiniteApi.getKycStatus(customerId)

  // If already approved (ACTIVE) after form submission, we're done
  if (currentKycStatus.kycStatus === 'ACTIVE') {
    return
  }

  // Show pending scene for non-ACTIVE statuses
  await showKycPendingScene(
    navigationFlow,
    infiniteApi,
    customerId,
    currentKycStatus.kycStatus
  )
}

// Helper function to show KYC pending scene
const showKycPendingScene = async (
  navigationFlow: NavigationFlow,
  infiniteApi: InfiniteApi,
  customerId: string,
  initialStatus: InfiniteKycStatus
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    const stepOffThreshold = 60000 // 1 minute

    const checkStatus = async (): Promise<RampPendingSceneStatus> => {
      const statusResponse = await infiniteApi.getKycStatus(customerId)
      const status = kycStatusToSceneStatus(statusResponse.kycStatus)
      return status
    }

    navigationFlow.navigate('rampPending', {
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

        const status = await checkStatus().catch((error: unknown) => ({
          error
        }))

        if ('error' in status) {
          // KYC is rejected, paused, or offboarded, exit workflow
          if (status.error instanceof I18nError) {
            reject(new ExitError(`KYC failed: ${status.error.message}`))
          } else {
            reject(new ExitError('KYC failed'))
          }
          // Throw error to be handled by the scene
          throw status.error
        }

        if (!status.isChecking) {
          if (status.message === lstrings.ramp_kyc_approved_message) {
            resolve()
          } else {
            reject(new ExitError(`KYC incomplete: ${status.message}`))
          }
        }

        return status
      },
      onCancel: () => {
        reject(new ExitError('User canceled the KYC status screen'))
      },
      onClose: () => {
        navigationFlow.goBack()
        reject(new ExitError('User closed KYC status screen'))
      }
    })
  })
}

const kycStatusToSceneStatus = (
  kycStatus: InfiniteKycStatus
): RampPendingSceneStatus => {
  switch (kycStatus) {
    case 'ACTIVE': {
      // KYC is approved, stop polling and continue workflow.
      // The next scene will use navigation.replace to replace this verification scene
      return {
        isChecking: false,
        message: lstrings.ramp_kyc_approved_message
      }
    }
    case 'PENDING':
      // KYC flow needs to be started/completed
      return {
        isChecking: false,
        message: lstrings.ramp_kyc_incomplete_message
      }
    case 'IN_REVIEW':
      // KYC is still pending, continue polling
      return {
        isChecking: true,
        message: lstrings.ramp_kyc_pending_message
      }
    case 'NEED_ACTIONS':
      // Additional information required
      return {
        isChecking: false,
        message: lstrings.ramp_kyc_additional_info_required
      }
    case 'REJECTED': {
      // Throw error instead of returning it
      throw new I18nError(
        lstrings.ramp_kyc_error_title,
        lstrings.ramp_kyc_rejected
      )
    }
  }
}

// Helper function to open KYC webview
const openKycWebView = async (
  navigationFlow: NavigationFlow,
  infiniteApi: InfiniteApi,
  customerId: string,
  pluginId: string
): Promise<void> => {
  const callbackUrl = `https://deep.edge.app/ramp/buy/${pluginId}`
  const kycLinkResponse = await infiniteApi.getKycLink(customerId, callbackUrl)
  const kycUrl = new URL(kycLinkResponse.url)

  await new Promise<void>((resolve, reject) => {
    let hasResolved = false

    navigationFlow.navigate('guiPluginWebView', {
      url: kycUrl.toString(),
      onUrlChange: async (url: string) => {
        // Only intercept the specific callback URL that ends the KYC flow.
        // This avoids relying on OS Universal Links behavior inside SafariView.
        let shouldClose = false
        try {
          const parsed = new URL(url)
          shouldClose =
            parsed.protocol === 'https:' &&
            parsed.host === 'deep.edge.app' &&
            parsed.pathname.startsWith(`/ramp/buy/${pluginId}`)
        } catch {
          // Some webviews may surface non-URL strings. Ignore.
        }

        if (shouldClose) {
          if (!hasResolved) {
            hasResolved = true
            // Close the webview scene:
            navigationFlow.goBack()
            resolve()
          }
        }
      },
      onClose: () => {
        if (!hasResolved) {
          hasResolved = true
          resolve()
        }
        return true // Allow close
      }
    })
  })
}
