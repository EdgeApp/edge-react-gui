// @flow

import { type Cleaner, asArray, asBoolean, asCodec, asObject, asOptional, asString, uncleaner } from 'cleaners'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { type CurrencySettingProps, maybeCurrencySetting } from '../hoc/MaybeCurrencySetting.js'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { useTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from './SettingsHeaderRow.js'
import { SettingsSwitchRow } from './SettingsSwitchRow.js'
import { SettingsTappableRow } from './SettingsTappableRow.js'

type CustomServersSetting = {
  enableCustomServers: boolean,
  customServers: string[]
}

type Props = CurrencySettingProps<CustomServersSetting, string | void>

function CustomServersSettingComponent(props: Props) {
  const { defaultSetting, setting, extraInfo, onUpdate } = props
  const { enableCustomServers, customServers } = setting
  const theme = useTheme()
  const styles = getStyles(theme)

  const titleText = extraInfo == null ? s.strings.settings_custom_nodes_title : sprintf(s.strings.settings_custom_servers_title, extraInfo)

  async function handleToggleEnabled(): Promise<void> {
    await onUpdate({
      enableCustomServers: !enableCustomServers,
      customServers: customServers.length > 0 ? customServers : defaultSetting.customServers
    })
    global.logActivity(`Enable Custom Nodes: enable=${(!enableCustomServers).toString()} numservers=${customServers.length}`)
  }

  async function handleDeleteNode(i: number): Promise<void> {
    const deletedNode = customServers[i]
    const list = [...customServers]
    list.splice(i, 1)

    await onUpdate({ enableCustomServers, customServers: list })
    global.logActivity(`Delete Custom Node: ${deletedNode}`)
  }

  function handleEditNode(i?: number): void {
    async function handleSubmit(text: string) {
      let before = 'no_node'
      const list = [...customServers]
      if (i == null) list.push(text)
      else {
        before = list[i]
        list[i] = text
      }
      await onUpdate({ enableCustomServers, customServers: list })
      global.logActivity(`Edit Custom Node: ${before} -> ${text}`)
      return true
    }

    Airship.show(bridge => (
      <TextInputModal
        autoCorrect={false}
        bridge={bridge}
        initialValue={i == null ? '' : customServers[i]}
        inputLabel={s.strings.settings_custom_node_url}
        title={s.strings.settings_edit_custom_node}
        onSubmit={handleSubmit}
      />
    ))
  }

  return (
    <>
      <SettingsHeaderRow label={titleText} />
      <SettingsSwitchRow label={s.strings.settings_enable_custom_nodes} value={enableCustomServers} onPress={handleToggleEnabled} />
      {!enableCustomServers ? null : (
        <>
          {customServers.map((server, i) => (
            <SettingsTappableRow key={`row${i}`} action="delete" onPress={() => handleDeleteNode(i)}>
              <TouchableOpacity onPress={() => handleEditNode(i)} style={styles.labelContainer}>
                <Text style={styles.labelText}>{server}</Text>
              </TouchableOpacity>
            </SettingsTappableRow>
          ))}
          <SettingsTappableRow action="add" label={s.strings.settings_add_custom_node} onPress={handleEditNode} />
        </>
      )}
    </>
  )
}

const getStyles = cacheStyles(theme => ({
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

export const MaybeBlockbookSetting = maybeCurrencySetting(CustomServersSettingComponent, asBlockbookServersSetting, s.strings.settings_blockbook)

export const MaybeCustomServersSetting = maybeCurrencySetting(CustomServersSettingComponent, asCustomServersSetting, undefined)

export const MaybeElectrumSetting = maybeCurrencySetting(CustomServersSettingComponent, asElectrumServersSetting, s.strings.settings_electrum)
