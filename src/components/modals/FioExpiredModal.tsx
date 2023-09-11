import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

export function FioExpiredModal(props: { bridge: AirshipBridge<boolean>; fioName: string }) {
  const { bridge, fioName } = props
  const title = `${lstrings.fio_address_confirm_screen_fio_label} ${lstrings.string_expiration}`

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <ModalTitle>{title}</ModalTitle>
      <ModalMessage>{lstrings.fio_domain_details_expired_soon}</ModalMessage>
      <ModalMessage>{fioName}</ModalMessage>
      <MainButton alignSelf="center" label={lstrings.title_fio_renew} marginRem={[1, 0.5, 0.5]} type="secondary" onPress={() => bridge.resolve(true)} />
    </ThemedModal>
  )
}
