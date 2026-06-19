import { asMaybe } from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import {
  CURRENCY_SETTINGS_KEYS,
  SPECIAL_CURRENCY_INFO,
  type WalletSetting
} from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { showError } from '../services/AirshipInstance'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'
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

  const walletSettings: WalletSetting[] = React.useMemo(
    () => SPECIAL_CURRENCY_INFO[pluginId]?.walletSettings ?? [],
    [pluginId]
  )

  // Wallets without their own settings card still reach Asset Settings from here
  // via a standalone chevron row, as long as the plugin has an asset-settings
  // scene. Plugins like Monero embed that navigation in their own card, so they
  // are excluded to avoid duplicating the row.
  const showAssetSettingsCard =
    wallet != null &&
    onNavigate != null &&
    CURRENCY_SETTINGS_KEYS.includes(pluginId) &&
    !walletSettings.some(
      walletSetting => walletSetting.navigation?.path === 'currencySettings'
    )

  // Plugin-specific labels showing what server each option resolves to given
  // the wallet's account-wide currency settings. Keyed by `<optionName>:<value>`.
  const resolvedServerLabels = React.useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    if (pluginId !== 'monero' || wallet == null) return out
    const settings = asMaybe(asMoneroUserSettings)(
      wallet.currencyConfig.userSettings
    )
    if (settings == null) return out
    out['backend:lws'] = settings.enableCustomServers
      ? lstrings.settings_monero_custom_lws
      : lstrings.settings_monero_edge_lws
    out['backend:monerod'] = settings.enableCustomMonerod
      ? lstrings.settings_monerod_custom_full_node
      : lstrings.settings_monerod_edge_full_node
    return out
  }, [pluginId, wallet])

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
        /*
        Special case for Monero. Do not allow imported wallets to user Edge LWS server
        */
        if (pluginId === 'monero') {
          const { enableCustomServers, moneroLightwalletServer } =
            asMoneroUserSettings(wallet?.currencyConfig.userSettings)
          if (
            wallet.imported &&
            result.settings.backend === 'lws' &&
            (!enableCustomServers ||
              /^monerolws\d+\.edge\.app$/i.test(
                new URL(moneroLightwalletServer).hostname
              ))
          ) {
            throw new Error(
              lstrings.settings_monero_edge_lws_imported_wallet_error
            )
          }
        }

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

  const handleAssetSettingsPress = useHandler((): void => {
    bridge.resolve(undefined)
    onNavigate?.('currencySettings')
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_settings_title}
      onCancel={handleCancel}
      scroll
    >
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
          <EdgeCard sections>
            {ws.options.map(option => {
              const resolved =
                resolvedServerLabels[`${ws.optionName}:${option.value}`]
              return (
                <SettingsRadioRow
                  key={option.value}
                  label={resolved ?? option.label}
                  value={localSettings[ws.optionName] === option.value}
                  onPress={() => {
                    handleSelect(ws.optionName, option.value)
                  }}
                />
              )
            })}
            {ws.navigation != null && onNavigate != null ? (
              <SettingsTappableRow
                label={ws.navigation.label}
                onPress={() => {
                  bridge.resolve(undefined)
                  onNavigate(ws.navigation!.path)
                }}
              />
            ) : null}
          </EdgeCard>
        </View>
      ))}

      {showAssetSettingsCard ? (
        <EdgeCard sections>
          <SettingsTappableRow
            label={lstrings.settings_asset_settings}
            onPress={handleAssetSettingsPress}
          />
        </EdgeCard>
      ) : null}

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
