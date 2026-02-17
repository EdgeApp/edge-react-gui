import type { EdgeCurrencyWallet } from 'edge-core-js'
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
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { asMoneroUserSettings } from '../themed/MaybeMoneroUserSettings'
import { EdgeModal } from './EdgeModal'

export interface WalletSettingsResult {
  name: string
  settings: Record<string, string>
}

interface Props {
  bridge: AirshipBridge<WalletSettingsResult | undefined>
  onNavigate?: (navigationPath: string) => void
  pluginId: string
  initialName: string
  initialSettings: Record<string, string>
  wallet?: EdgeCurrencyWallet
}

interface EditWalletSettingsProps
  extends Omit<Props, 'pluginId' | 'initialSettings' | 'initialName'> {
  wallet: EdgeCurrencyWallet
}

export const WalletSettingsModal: React.FC<Props> = props => {
  const { bridge, initialSettings, onNavigate, initialName, wallet, pluginId } =
    props
  const theme = useTheme()
  const styles = getStyles(theme)

  const walletSettings: WalletSetting[] = React.useMemo(
    () => SPECIAL_CURRENCY_INFO[pluginId]?.walletSettings ?? [],
    [pluginId]
  )

  const [name, setName] = React.useState(initialName)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
    if (isSubmitting) return
    bridge.resolve(undefined)
  })

  const handleSubmit = useHandler(async () => {
    const result = { name, settings: localSettings }

    if (wallet == null) {
      bridge.resolve(result)
      return
    }

    setIsSubmitting(true)
    try {
      if (result.name !== wallet.name) {
        await wallet.renameWallet(result.name)
      }
      if (Object.keys(result.settings).length > 0) {
        await wallet.changeWalletSettings({
          ...wallet.walletSettings,
          ...result.settings
        })
      }
      bridge.resolve(undefined)
    } catch (error) {
      setIsSubmitting(false)
      showError(error)
    }
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
              <Paragraph>{ws.displayDescription}</Paragraph>
              {ws.navigation != null && onNavigate != null ? (
                <EdgeTouchableOpacity
                  onPress={() => {
                    bridge.resolve(undefined)
                    onNavigate(ws.navigation!.path)
                  }}
                >
                  <EdgeText style={styles.linkText}>
                    {ws.navigation.label}
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
          onPress: handleSubmit,
          disabled: isSubmitting,
          spinner: isSubmitting
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

export const EditWalletSettingsModal: React.FC<
  EditWalletSettingsProps
> = props => {
  const { wallet } = props
  return (
    <WalletSettingsModal
      {...props}
      initialSettings={wallet.walletSettings}
      pluginId={wallet.currencyInfo.pluginId}
      initialName={wallet.name ?? ''}
    />
  )
}
