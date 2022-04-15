// @flow

import * as React from 'react'
import { AppState } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { check, openSettings } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { useEffect } from '../../types/reactHooks.js'
import { showError } from '../services/AirshipInstance.js'
import { checkIfDenied } from '../services/PermissionsManager.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

export function PermissionsSettingModal(props: {
  bridge: AirshipBridge<boolean>, // returns true if mandatory and denied
  fullPermision: string,
  mandatory: boolean,
  name: string,
  permission: string
}) {
  const { bridge, fullPermision, mandatory, name, permission } = props

  useEffect(() => {
    const listener = AppState.addEventListener('change', handleChangePermissions)
    return () => listener.remove()
  })

  const message = mandatory
    ? sprintf(s.strings.contacts_permission_modal_enable_settings_mandatory, name, permission)
    : sprintf(s.strings.contacts_permission_modal_enable_settings, name, permission)

  const handleChangePermissions = async () => {
    if (mandatory && !checkIfDenied(await check(fullPermision))) {
      bridge.resolve(false)
    }
  }

  const handlePress = () => {
    openSettings().catch(showError)
    if (!mandatory) handleClose()
  }

  const handleClose = () => bridge.resolve(mandatory)

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleClose}>
      <ModalMessage>{message}</ModalMessage>
      <MainButton label={s.strings.string_ok_cap} marginRem={0.5} type="primary" onPress={handlePress} />
      <ModalCloseArrow onPress={handleClose} />
    </ThemedModal>
  )
}
