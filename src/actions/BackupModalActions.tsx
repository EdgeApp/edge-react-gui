import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { BackupForAccountModal, BackupForTransferModal, BackupForTransferModalResult, BackupModalResult } from '../components/modals/BackupModal'
import { Airship, showDevError } from '../components/services/AirshipInstance'
import { RootSceneProps } from '../types/routerTypes'

let isBackupModalShowing = false

/**
 * Shows a modal prompting the user to back up their account, only if the modal
 * isn't already showing.
 */
export const showBackupModal = (props: { navigation: RootSceneProps<'edgeApp'>['navigation']; forgetLoginId?: string }) => {
  if (isBackupModalShowing) return

  isBackupModalShowing = true
  const { navigation, forgetLoginId } = props

  Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => {
    return <BackupForAccountModal bridge={bridge} forgetLoginId={forgetLoginId} />
  })
    .then((userSel?: BackupModalResult) => {
      if (userSel === 'upgrade') {
        navigation.navigate('edgeApp', {
          screen: 'edgeAppStack',
          params: {
            screen: 'upgradeUsername'
          }
        })
      }
    })
    .finally(() => {
      isBackupModalShowing = false
    })
    .catch(error => showDevError(error))
}

/**
 * Checks an account for light status and shows a backup modal if the account is
 * a light account. Returns true if the modal was shown.
 */
export const checkAndShowLightBackupModal = (account: EdgeAccount, navigation: RootSceneProps<'edgeApp'>['navigation']): boolean => {
  if (account.username == null) {
    Airship.show((bridge: AirshipBridge<BackupForTransferModalResult | undefined>) => {
      return <BackupForTransferModal bridge={bridge} />
    })
      .then((userSel?: BackupForTransferModalResult) => {
        if (userSel === 'upgrade') {
          navigation.navigate('edgeApp', {
            screen: 'edgeAppStack',
            params: {
              screen: 'upgradeUsername'
            }
          })
        }
      })
      .finally(() => {
        isBackupModalShowing = false
      })
      .catch(error => showDevError(error))
    return true
  }
  return false
}
