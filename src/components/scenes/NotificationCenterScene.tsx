import * as React from 'react'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { getLocalAccountSettings } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { DeviceNotifInfo } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { useTheme } from '../services/ThemeContext'

interface Props extends EdgeAppSceneProps<'notificationCenter'> {}

export const NotificationCenterScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const { deviceNotifState } = getDeviceSettings()
  const accountNotifDismissInfo = getLocalAccountSettings().accountNotifDismissInfo

  const pinnedNotifInfos = Object.values(deviceNotifState).filter(deviceNotifInfo => deviceNotifInfo.isPriority)
  const otherNotifInfos = Object.values(deviceNotifState).filter(deviceNotifInfo => !deviceNotifInfo.isPriority)

  return (
    <SceneWrapper>
      <SectionHeader leftTitle={lstrings.pinned_notifications} />
      <></>
      <SectionHeader leftTitle={lstrings.other_notifications} />
    </SceneWrapper>
  )
}
