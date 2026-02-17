import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import {
  SPECIAL_CURRENCY_INFO,
  type WalletSetting
} from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'

export interface WalletSettingsResult {
  name: string
  settings: Record<string, string>
}

interface Props {
  bridge: AirshipBridge<WalletSettingsResult | undefined>
  initialName: string
  pluginId: string
  initialSettings?: Record<string, string>
  onNavigate?: (navigationPath: string) => void
}

export const WalletSettingsModal: React.FC<Props> = props => {
  const { bridge, initialName, pluginId, initialSettings, onNavigate } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const walletSettings: WalletSetting[] = React.useMemo(
    () => SPECIAL_CURRENCY_INFO[pluginId]?.walletSettings ?? [],
    [pluginId]
  )

  const [name, setName] = React.useState(initialName)

  const [localSettings, setLocalSettings] = React.useState<
    Record<string, string>
  >(() => {
    const out: Record<string, string> = {}
    for (const ws of walletSettings) {
      out[ws.optionName] =
        initialSettings?.[ws.optionName] ?? ws.options[0]?.value ?? ''
    }
    return out
  })

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleSubmit = useHandler(() => {
    bridge.resolve({ name, settings: localSettings })
  })

  const handleSelect = useHandler((optionName: string, value: string): void => {
    setLocalSettings(prev => ({ ...prev, [optionName]: value }))
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_settings_title}
      onCancel={handleCancel}
      scroll
    >
      <SettingsHeaderRow label={lstrings.wallet_settings_wallet_name} />
      <ModalFilledTextInput
        autoCorrect={false}
        autoFocus={false}
        value={name}
        onChangeText={setName}
        placeholder={lstrings.wallet_settings_wallet_name}
        returnKeyType="done"
      />

      {walletSettings.map(ws => (
        <View key={ws.optionName}>
          <SettingsHeaderRow label={ws.displayName} />
          {ws.displayDescription != null ? (
            <View style={styles.descriptionContainer}>
              <Paragraph>{ws.displayDescription.message}</Paragraph>
              {ws.displayDescription.navigationPath != null &&
              onNavigate != null ? (
                <EdgeTouchableOpacity
                  onPress={() => {
                    bridge.resolve(undefined)
                    onNavigate(ws.displayDescription!.navigationPath!)
                  }}
                >
                  <EdgeText style={styles.linkText}>
                    {ws.displayDescription.navigationPath === 'currencySettings'
                      ? lstrings.settings_asset_settings
                      : ws.displayDescription.navigationPath}
                  </EdgeText>
                </EdgeTouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {ws.options.map(option => (
            <SettingsRadioRow
              key={option.value}
              label={option.label}
              value={localSettings[ws.optionName] === option.value}
              onPress={() => {
                handleSelect(ws.optionName, option.value)
              }}
            />
          ))}
        </View>
      ))}

      <ModalButtons
        primary={{
          label: lstrings.string_done_cap,
          onPress: handleSubmit
        }}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  descriptionContainer: {
    paddingHorizontal: theme.rem(0.5),
    paddingBottom: theme.rem(0.5)
  },
  linkText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25)
  }
}))
