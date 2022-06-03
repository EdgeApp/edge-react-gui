// @flow
import { useCavy } from 'cavy'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import { check, openSettings } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useIsAppForeground } from '../../hooks/useIsAppForeground.js'
import s from '../../locales/strings.js'
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
  const isAppForeground = useIsAppForeground()

  const message = mandatory
    ? sprintf(s.strings.contacts_permission_modal_enable_settings_mandatory, name, permission)
    : sprintf(s.strings.contacts_permission_modal_enable_settings, name, permission)

  useAsyncEffect(async () => {
    if (!isAppForeground || !mandatory) return
    const status = await check(fullPermision)
    if (!checkIfDenied(status)) bridge.resolve(false)
  }, [fullPermision, isAppForeground])

  const handlePress = () => {
    openSettings().catch(showError)
    if (!mandatory) handleClose()
  }

  const handleClose = () => bridge.resolve(mandatory)
  const generateTestHook = useCavy()

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleClose}>
      <ModalMessage>{message}</ModalMessage>
      <MainButton label={s.strings.string_ok_cap} marginRem={0.5} type="primary" onPress={handlePress} />
      <ModalCloseArrow onPress={handleClose} ref={generateTestHook('PermissionSettingModal.Close')} />
    </ThemedModal>
  )
}
