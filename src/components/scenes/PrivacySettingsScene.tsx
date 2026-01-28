import { asMaybe, uncleaner } from 'cleaners'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SceneContainer } from '../layout/SceneContainer'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { Paragraph, SmallText } from '../themed/EdgeText'
import {
  asPrivateNetworkingSetting,
  type PrivateNetworkingSetting
} from '../themed/MaybePrivateNetworkingSetting'

interface Props extends EdgeAppSceneProps<'privacySettings'> {}

const asMaybePrivateNetworkingSetting = asMaybe(asPrivateNetworkingSetting)
const wasPrivateNetworkingSetting = uncleaner(asPrivateNetworkingSetting)

export const PrivacySettingsScene: React.FC<Props> = props => {
  const account = useSelector(state => state.core.account)
  const { currencyConfig } = account

  // Get list of pluginIds that support network privacy
  const supportedPluginIds = React.useMemo(() => {
    return Object.keys(currencyConfig).filter(pluginId => {
      const config = currencyConfig[pluginId]
      const defaultSetting = asMaybePrivateNetworkingSetting(
        config.currencyInfo.defaultSettings
      )
      return defaultSetting != null
    })
  }, [currencyConfig])

  return (
    <SceneWrapper scroll>
      <SceneContainer>
        <SettingsHeaderRow label={lstrings.settings_nym_mixnet_title} />
        <Paragraph>
          <SmallText>{lstrings.settings_nym_mixnet_description}</SmallText>
        </Paragraph>
        <EdgeCard sections>
          {supportedPluginIds.map(pluginId => (
            <PrivacyToggleRow key={pluginId} pluginId={pluginId} />
          ))}
        </EdgeCard>
      </SceneContainer>
    </SceneWrapper>
  )
}

interface ToggleRowProps {
  pluginId: string
}

const PrivacyToggleRow: React.FC<ToggleRowProps> = props => {
  const { pluginId } = props
  const account = useSelector(state => state.core.account)
  const currencyConfig = account.currencyConfig[pluginId]
  const { displayName } = currencyConfig.currencyInfo

  const userSettings = useWatch(currencyConfig, 'userSettings')
  const setting = React.useMemo(
    () => asMaybePrivateNetworkingSetting(userSettings),
    [userSettings]
  )

  const defaultSetting = React.useMemo(
    () =>
      asMaybePrivateNetworkingSetting(
        currencyConfig.currencyInfo.defaultSettings
      ),
    [currencyConfig]
  )

  const isEnabled = (setting ?? defaultSetting)?.networkPrivacy === 'nym'

  const handleToggle = useHandler(async () => {
    const currentSetting: PrivateNetworkingSetting = setting ??
      defaultSetting ?? { networkPrivacy: 'none' }
    const newPrivacy = currentSetting.networkPrivacy === 'nym' ? 'none' : 'nym'

    await currencyConfig.changeUserSettings({
      ...currencyConfig.userSettings,
      ...wasPrivateNetworkingSetting({ networkPrivacy: newPrivacy })
    })
    logActivity(`Network privacy for ${pluginId}: ${newPrivacy}`)
  })

  return (
    <SettingsSwitchRow
      label={displayName}
      value={isEnabled}
      onPress={handleToggle}
    >
      <CryptoIcon
        marginRem={[0.5, 0, 0.5, 0.5]}
        pluginId={pluginId}
        tokenId={null}
        sizeRem={1.25}
      />
    </SettingsSwitchRow>
  )
}
