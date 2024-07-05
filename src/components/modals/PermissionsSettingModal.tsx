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
import { Paragraph } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { EdgeModal } from './EdgeModal'

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

  useAsyncEffect(
    async () => {
      if (!isAppForeground || !mandatory) return
      const status = await check(permissionNames[permission])
      if (!checkIfDenied(status)) bridge.resolve(false)
      return () => {}
    },
    [permission, isAppForeground],
    'PermissionsSettingModal'
  )

  const handlePress = () => {
    openSettings().catch(error => showError(error))
    if (!mandatory) handleClose()
  }

  const handleClose = () => bridge.resolve(mandatory)

  return (
    <EdgeModal bridge={bridge} onCancel={handleClose}>
      <Paragraph>{message}</Paragraph>
      <MainButton label={lstrings.string_ok_cap} marginRem={1} type="primary" onPress={handlePress} />
    </EdgeModal>
  )
}
