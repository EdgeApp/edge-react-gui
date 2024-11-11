import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { Paragraph } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { EdgeModal } from './EdgeModal'

export function FioExpiredModal(props: { bridge: AirshipBridge<boolean>; fioName: string }) {
  const { bridge, fioName } = props
  const title = `${lstrings.fio_address_confirm_screen_fio_label} ${lstrings.string_expiration}`

  return (
    <EdgeModal bridge={bridge} title={title} onCancel={() => bridge.resolve(false)}>
      <Paragraph>{lstrings.fio_domain_details_expired_soon}</Paragraph>
      <Paragraph>{fioName}</Paragraph>
      <MainButton label={lstrings.title_fio_renew} marginRem={1} type="secondary" onPress={() => bridge.resolve(true)} />
    </EdgeModal>
  )
}
