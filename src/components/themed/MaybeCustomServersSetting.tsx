import { asArray, asBoolean, asCodec, asObject, asOptional, asString, Cleaner, uncleaner } from 'cleaners'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { logActivity } from '../../util/logger'
import { CurrencySettingProps, maybeCurrencySetting } from '../hoc/MaybeCurrencySetting'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface CustomServersSetting {
  enableCustomServers: boolean
  customServers: string[]
}

type Props = CurrencySettingProps<CustomServersSetting, string | undefined>

function CustomServersSettingComponent(props: Props) {
  const { defaultSetting, setting, extraInfo, onUpdate } = props
  const { enableCustomServers, customServers } = setting
  const theme = useTheme()
  const styles = getStyles(theme)

  const titleText = extraInfo == null ? lstrings.settings_custom_nodes_title : sprintf(lstrings.settings_custom_servers_title, extraInfo)
  const customServerSet = new Set(customServers)

  const handleToggleEnabled = useHandler(async (): Promise<void> => {
    await onUpdate({
      enableCustomServers: !enableCustomServers,
      customServers: customServerSet.size > 0 ? Array.from(customServerSet) : defaultSetting.customServers
    })
    logActivity(`Enable Custom Nodes: enable=${(!enableCustomServers).toString()} numservers=${customServerSet.size}`)
  })

  async function handleDeleteNode(server: string): Promise<void> {
    customServerSet.delete(server)
    await onUpdate({ enableCustomServers, customServers: Array.from(customServerSet) })
    logActivity(`Delete Custom Node: ${server}`)
  }

  const handleEditNode = useHandler((server?: string): void => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCorrect={false}
        bridge={bridge}
        initialValue={server ?? ''}
        inputLabel={lstrings.settings_custom_node_url}
        title={lstrings.settings_edit_custom_node}
        onSubmit={async (text: string) => {
          let before = 'no_node'
          if (server != null) {
            customServerSet.delete(server)
            before = server
            server = text
          }
          customServerSet.add(text)
          await onUpdate({ enableCustomServers, customServers: Array.from(customServerSet) })
          logActivity(`Edit Custom Node: ${before} -> ${text}`)
          return true
        }}
      />
    )).catch(err => showError(err))
  })

  return (
    <>
      <SettingsHeaderRow label={titleText} />
      <SettingsSwitchRow label={lstrings.settings_enable_custom_nodes} value={enableCustomServers} onPress={handleToggleEnabled} />
      {!enableCustomServers ? null : (
        <>
          {Array.from(customServerSet).map(server => (
            <SettingsTappableRow key={server} action="delete" onPress={async () => await handleDeleteNode(server)}>
              <TouchableOpacity onPress={() => handleEditNode(server)} style={styles.labelContainer}>
                <Text style={styles.labelText}>{server}</Text>
              </TouchableOpacity>
            </SettingsTappableRow>
          ))}
          <SettingsTappableRow action="add" label={lstrings.settings_add_custom_node} onPress={handleEditNode} />
        </>
      )}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // We use a hack to make the text tappable separately from the switch.
  labelContainer: {
    flexGrow: 10,
    flexShrink: 1,
    // Stretch outward to cover the row:
    margin: -theme.rem(0.5),
    padding: theme.rem(0.5)
  },
  labelText: {
    color: theme.primaryText,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    paddingHorizontal: theme.rem(0.5),
    textAlign: 'left'
  }
}))

//
// Cleaners for raw settings:
//

const asBlockbookSetting = asObject({
  enableCustomServers: asOptional(asBoolean, false),
  blockbookServers: asArray(asString)
})

const asCustomServersSetting: Cleaner<CustomServersSetting> = asObject({
  enableCustomServers: asOptional(asBoolean, false),
  customServers: asArray(asString)
})

const asElectrumSetting = asObject({
  disableFetchingServers: asOptional(asBoolean, false),
  electrumServers: asArray(asString)
})

const wasBlockbookSetting = uncleaner(asBlockbookSetting)
const wasElectrumSetting = uncleaner(asElectrumSetting)

//
// Wrapped cleaners to produce the common format:
//

const asBlockbookServersSetting: Cleaner<CustomServersSetting> = asCodec(
  raw => {
    const clean = asBlockbookSetting(raw)
    return {
      enableCustomServers: clean.enableCustomServers,
      customServers: clean.blockbookServers
    }
  },
  clean =>
    wasBlockbookSetting({
      enableCustomServers: clean.enableCustomServers,
      blockbookServers: clean.customServers
    })
)

const asElectrumServersSetting: Cleaner<CustomServersSetting> = asCodec(
  raw => {
    const clean = asElectrumSetting(raw)
    return {
      enableCustomServers: clean.disableFetchingServers,
      customServers: clean.electrumServers
    }
  },
  clean =>
    wasElectrumSetting({
      disableFetchingServers: clean.enableCustomServers,
      electrumServers: clean.customServers
    })
)

//
// Individual settings sections:
//

export const MaybeBlockbookSetting = maybeCurrencySetting(CustomServersSettingComponent, asBlockbookServersSetting, lstrings.settings_blockbook)

export const MaybeCustomServersSetting = maybeCurrencySetting(CustomServersSettingComponent, asCustomServersSetting, undefined)

export const MaybeElectrumSetting = maybeCurrencySetting(CustomServersSettingComponent, asElectrumServersSetting, lstrings.settings_electrum)
