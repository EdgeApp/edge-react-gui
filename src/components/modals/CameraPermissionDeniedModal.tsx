import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'
import { openSettings } from 'react-native-permissions'

import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { showError } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<void>
}

/**
 * Recovery guidance shown when the camera permission is denied or blocked.
 *
 * This deliberately carries no scam warning: the warning has its own trigger
 * (the first successful use of the camera) and its own modal, so that neither
 * one can hide or cut short the other.
 */
export const CameraPermissionDeniedModal: React.FC<Props> = props => {
  const { bridge } = props

  const handleClose = (): void => {
    bridge.resolve()
  }

  const handleSettings = (): void => {
    openSettings().catch((error: unknown) => {
      showError(error)
    })
    handleClose()
  }

  return (
    <EdgeModal bridge={bridge} onCancel={handleClose}>
      <Paragraph>{lstrings.scan_camera_permission_denied}</Paragraph>
      <ModalButtons
        primary={{ onPress: handleSettings, label: lstrings.open_settings }}
      />
    </EdgeModal>
  )
}
