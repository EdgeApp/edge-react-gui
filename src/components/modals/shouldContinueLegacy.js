// @flow

import React from 'react'

import s from '../../locales/strings.js'
import { Airship } from '../services/AirshipInstance.js'
import { ButtonsModal } from './ButtonsModal.js'

export const shouldContinueLegacy = async () => {
  const response = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.legacy_address_modal_title}
      message={s.strings.legacy_address_modal_warning}
      buttons={{
        confirm: { label: s.strings.legacy_address_modal_continue },
        cancel: { label: s.strings.legacy_address_modal_cancel, outlined: true }
      }}
    />
  ))

  return response === 'confirm'
}
