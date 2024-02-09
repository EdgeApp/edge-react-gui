import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { ModalUi4 } from '../ui4/ModalUi4'

export function FioExpiredModal(props: { bridge: AirshipBridge<boolean>; fioName: string }) {
  const { bridge, fioName } = props
  const title = `${lstrings.fio_address_confirm_screen_fio_label} ${lstrings.string_expiration}`

  return (
    <ModalUi4 bridge={bridge} title={title} onCancel={() => bridge.resolve(false)}>
      <ModalMessage>{lstrings.fio_domain_details_expired_soon}</ModalMessage>
      <ModalMessage>{fioName}</ModalMessage>
      <MainButton label={lstrings.title_fio_renew} marginRem={1} type="secondary" onPress={() => bridge.resolve(true)} />
    </ModalUi4>
  )
}
