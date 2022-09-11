import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { check, openSettings } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import s from '../../locales/strings'
import { showError } from '../services/AirshipInstance'
import { checkIfDenied } from '../services/PermissionsManager'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalMessage } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

export function PermissionsSettingModal(props: {
  bridge: AirshipBridge<boolean> // returns true if mandatory and denied
  fullPermision: string
  mandatory: boolean
  name: string
  permission: string
}) {
  const { bridge, fullPermision, mandatory, name, permission } = props
  const isAppForeground = useIsAppForeground()

  const message = mandatory
    ? sprintf(s.strings.contacts_permission_modal_enable_settings_mandatory, name, permission)
    : sprintf(s.strings.contacts_permission_modal_enable_settings, name, permission)

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (!isAppForeground || !mandatory) return
    // @ts-expect-error
    const status = await check(fullPermision)
    if (!checkIfDenied(status)) bridge.resolve(false)
  }, [fullPermision, isAppForeground])

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
