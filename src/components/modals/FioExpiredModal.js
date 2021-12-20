// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

export function FioExpiredModal(props: { bridge: AirshipBridge<boolean>, fioName: string }) {
  const { bridge, fioName } = props
  const title = `${s.strings.fio_address_confirm_screen_fio_label} ${s.strings.string_expiration}`

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <ModalTitle>{title}</ModalTitle>
      <ModalMessage>{s.strings.fio_domain_details_expired_soon}</ModalMessage>
      <ModalMessage>{fioName}</ModalMessage>
      <MainButton alignSelf="center" label={s.strings.title_fio_renew} marginRem={[1, 0.5, 0.5]} type="secondary" onPress={() => bridge.resolve(true)} />
      <ModalCloseArrow onPress={() => bridge.resolve(false)} />
    </ThemedModal>
  )
}
