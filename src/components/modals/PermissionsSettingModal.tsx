import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { check, openSettings } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { lstrings } from '../../locales/strings'
import { Permission, permissionNames } from '../../reducers/PermissionsReducer'
import { showError } from '../services/AirshipInstance'
import { checkIfDenied } from '../services/PermissionsManager'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

export function PermissionsSettingModal(props: {
  bridge: AirshipBridge<boolean> // returns true if mandatory and denied
  mandatory: boolean
  name: string
  permission: Permission
}) {
  const { bridge, mandatory, name, permission } = props
  const isAppForeground = useIsAppForeground()

  const message = mandatory
    ? sprintf(lstrings.contacts_permission_modal_enable_settings_mandatory, name, permission)
    : sprintf(lstrings.contacts_permission_modal_enable_settings, name, permission)

  useAsyncEffect(async () => {
    if (!isAppForeground || !mandatory) return
    const status = await check(permissionNames[permission])
    if (!checkIfDenied(status)) bridge.resolve(false)
    return () => {}
  }, [permission, isAppForeground])

  const handlePress = () => {
    openSettings().catch(showError)
    if (!mandatory) handleClose()
  }

  const handleClose = () => bridge.resolve(mandatory)

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleClose}>
      <ModalMessage>{message}</ModalMessage>
      <MainButton label={lstrings.string_ok_cap} marginRem={0.5} type="primary" onPress={handlePress} />
    </ThemedModal>
  )
}
