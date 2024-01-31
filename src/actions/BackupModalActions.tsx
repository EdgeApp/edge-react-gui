import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { BackupForTransferModal, BackupForTransferModalResult } from '../components/modals/BackupForTransferModal'
import { BackupModal, BackupModalResult } from '../components/modals/BackupModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { NavigationBase } from '../types/routerTypes'

let isBackupModalShowing = false

/**
 * Shows a modal prompting the user to back up their account, only if the modal
 * isn't already showing.
 */
export const showBackupModal = (props: { navigation: NavigationBase; forgetLoginId?: string }) => {
  if (isBackupModalShowing) return

  isBackupModalShowing = true
  const { navigation, forgetLoginId } = props

  Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => {
    return <BackupModal bridge={bridge} forgetLoginId={forgetLoginId} />
  })
    .then((userSel?: BackupModalResult) => {
      if (userSel === 'upgrade') {
        navigation.navigate('upgradeUsername', {})
      }
    })
    .finally(() => {
      isBackupModalShowing = false
    })
    .catch(error => showError(error))
}

/**
 * Shows a modal notifying the user that certain certain actions are not
 * available for light accounts, prompting them to back up their account to
 * access those features.
 */
export const showBackupForTransferModal = (onConfirm: () => void) => {
  Airship.show((bridge: AirshipBridge<BackupForTransferModalResult | undefined>) => {
    return <BackupForTransferModal bridge={bridge} />
  })
    .then((userSel?: BackupForTransferModalResult) => {
      if (userSel === 'upgrade') {
        onConfirm()
      }
    })
    .catch(error => showError(error))
}
