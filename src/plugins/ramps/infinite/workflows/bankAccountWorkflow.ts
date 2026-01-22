import type { BankFormData } from '../../../../components/scenes/RampBankFormScene'
import type { EdgeVault } from '../../../../util/vault/edgeVault'
import { ExitError } from '../../utils/exitUtils'
import type { InfiniteApi } from '../infiniteApiTypes'
import type { NavigationFlow } from '../utils/navigationFlow'

interface Params {
  countryCode: string
  infiniteApi: InfiniteApi
  navigationFlow: NavigationFlow
  vault: EdgeVault
}

interface Result {
  bankAccountId: string
}

export const bankAccountWorkflow = async (params: Params): Promise<Result> => {
  const { countryCode, infiniteApi, navigationFlow, vault } = params

  const authState = infiniteApi.getAuthState()

  // Get existing bank accounts using customer ID
  if (authState.customerId != null) {
    const customerAccounts = await infiniteApi.getCustomerAccounts(
      authState.customerId
    )

    if (customerAccounts.accounts.length > 0) {
      // Use the first bank account
      const bankAccountId = customerAccounts.accounts[0].id
      console.log(
        `[bankAccountWorkflow] Using existing bank account: ${bankAccountId}`
      )
      return { bankAccountId }
    }
  }

  // Try to get personal info from vault to prepopulate the form
  const personalInfoUuid = await vault.getUuid('personalInfo', 0)
  const personalInfo =
    personalInfoUuid != null
      ? await vault.getPersonalInfo(personalInfoUuid)
      : null

  const bankAccountId = await new Promise<string>((resolve, reject) => {
    navigationFlow.navigate('rampBankForm', {
      countryCode,
      initialFirstName: personalInfo?.name.firstName,
      initialLastName: personalInfo?.name.lastName,
      onSubmit: async (formData: BankFormData) => {
        const bankAccount = await infiniteApi.addBankAccount({
          type: 'bank_account',
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountOwnerName: [
            formData.ownerFirstName,
            formData.ownerLastName
          ].join(' '),
          accountNumber: formData.accountNumber,
          routingNumber: formData.routingNumber
        })

        // Save or update bank account info in vault
        const bankAccountUuid = await vault.getUuid('bankAccountInfo', 0)
        const bankAccountInfo = {
          type: 'bankAccountInfo' as const,
          bankName: formData.bankName,
          ownerName: {
            firstName: formData.ownerFirstName,
            lastName: formData.ownerLastName
          },
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          routingNumber: formData.routingNumber
        }
        if (bankAccountUuid != null) {
          await vault.updateBankAccountInfo(bankAccountUuid, bankAccountInfo)
        } else {
          await vault.createBankAccountInfo(bankAccountInfo)
        }

        resolve(bankAccount.id)
      },
      onCancel: () => {
        reject(new ExitError('User cancelled bank account form'))
      }
    })
  })

  return { bankAccountId }
}
