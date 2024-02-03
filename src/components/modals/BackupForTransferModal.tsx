import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { ModalMessage } from '../themed/ModalParts'
import { ButtonsModal } from './ButtonsModal'

export type BackupForTransferModalResult = 'upgrade'

interface Props {
  bridge: AirshipBridge<BackupForTransferModalResult | undefined>
}

export function BackupForTransferModal(props: Props) {
  const { bridge } = props

  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.backup_account }
      }}
      title={lstrings.backup_title}
      closeArrow
    >
      <ModalMessage paddingRem={[0, 0, 1.5, 0]}>{lstrings.backup_for_transfer_message}</ModalMessage>
    </ButtonsModal>
  )
}
