// @flow

import { asArray, asBoolean, asMaybe, asObject, asOptional, asString } from 'cleaners'
import type { EdgeAccount, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, Text, TouchableOpacity } from 'react-native'

import { setDenominationKeyRequest } from '../../actions/SettingsActions.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { connect } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type OwnProps = {
  route: RouteProp<'currencySettings'>
}
type StateProps = {
  account: EdgeAccount,
  selectedDenominationMultiplier: string
}
type DispatchProps = {
  selectDenomination: (pluginId: string, currencyCode: string, denomination: EdgeDenomination) => Promise<void>
}
type Props = StateProps & DispatchProps & ThemeProps & OwnProps

const asElectrumDefaults = asObject({
  electrumServers: asArray(asString)
})

const asElectrumSettings = asObject({
  disableFetchingServers: asOptional(asBoolean),
  electrumServers: asOptional(asArray(asString))
})

export function CurrencySettingsComponent(props: Props) {
  const { account, selectDenomination, selectedDenominationMultiplier, theme, route } = props
  const { currencyInfo } = route.params
  const { currencyCode, defaultSettings, denominations, pluginId } = currencyInfo
  const currencyConfig = account.currencyConfig[pluginId]
  const styles = getStyles(theme)

  // Follow the on-disk currency settings:
  const [userSettings = {}, setUserSettings] = useState(currencyConfig.userSettings)
  useEffect(() => currencyConfig.watch('userSettings', setUserSettings), [currencyConfig])

  // Are the electrum servers enabled? What are they?
  const defaults = asMaybe(asElectrumDefaults)(defaultSettings)
  const settings = asMaybe(asElectrumSettings)(userSettings)

  function renderCustomNodes(defaults: $Call<typeof asElectrumDefaults>, settings: $Call<typeof asElectrumSettings>) {
    const { electrumServers: defaultServers } = defaults
    const { disableFetchingServers = false, electrumServers = [] } = settings

    async function handleToggleNodes(): Promise<void> {
      await currencyConfig.changeUserSettings({
        ...currencyConfig.userSettings,
        disableFetchingServers: !disableFetchingServers,
        electrumServers: electrumServers.length > 0 ? electrumServers : defaultServers
      })
    }

    async function handleDeleteNode(i: number): Promise<void> {
      const list = [...electrumServers]
      list.splice(i, 1)

      await currencyConfig.changeUserSettings({
        ...currencyConfig.userSettings,
        electrumServers: list
      })
    }

    function handleEditNode(i?: number): void {
      async function handleSubmit(text: string) {
        const list = [...electrumServers]
        if (i == null) list.push(text)
        else list[i] = text

        await currencyConfig.changeUserSettings({
          ...currencyConfig.userSettings,
          electrumServers: list
        })
        return true
      }

      Airship.show(bridge => (
        <TextInputModal
          autoCorrect={false}
          bridge={bridge}
          initialValue={i == null ? '' : electrumServers[i]}
          inputLabel={s.strings.settings_custom_node_url}
          title={s.strings.settings_edit_custom_node}
          onSubmit={handleSubmit}
        />
      ))
    }

    return (
      <>
        <SettingsHeaderRow label={s.strings.settings_custom_nodes_title} />
        <SettingsSwitchRow label={s.strings.settings_enable_custom_nodes} value={disableFetchingServers} onPress={handleToggleNodes} />
        {!disableFetchingServers ? null : (
          <>
            {electrumServers.map((server, i) => (
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

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>
        <SettingsHeaderRow label={s.strings.settings_denominations_title} />
        {denominations.map(denomination => {
          const key = denomination.multiplier
          const isSelected = key === selectedDenominationMultiplier
          return (
            <SettingsRadioRow key={denomination.multiplier} value={isSelected} onPress={() => selectDenomination(pluginId, currencyCode, denomination)}>
              <Text style={styles.labelText}>
                <Text style={styles.symbolText}>{denomination.symbol}</Text>
                {' - ' + denomination.name}
              </Text>
            </SettingsRadioRow>
          )
        })}
        {defaults == null || settings == null ? null : renderCustomNodes(defaults, settings)}
      </ScrollView>
    </SceneWrapper>
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
  },
  symbolText: {
    fontFamily: theme.fontFaceSymbols
  }
}))

export const CurrencySettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    account: state.core.account,
    selectedDenominationMultiplier: getDisplayDenomination(state, params.currencyInfo.pluginId, params.currencyInfo.currencyCode).multiplier
  }),
  dispatch => ({
    async selectDenomination(pluginId, currencyCode, denomination) {
      await dispatch(setDenominationKeyRequest(pluginId, currencyCode, denomination))
    }
  })
)(withTheme(CurrencySettingsComponent))
