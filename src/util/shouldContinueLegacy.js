// @flow

import React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'

export const shouldContinueLegacy = async () => {
  const response = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.legacy_address_modal_title}
      message={s.strings.legacy_address_modal_warning}
      buttons={{
        confirm: { label: s.strings.legacy_address_modal_continue },
        cancel: { label: s.strings.legacy_address_modal_cancel, type: 'secondary' }
      }}
    />
  ))

  return response === 'confirm'
}
