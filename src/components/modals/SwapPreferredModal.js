// @flow

import { type EdgePluginMap, type EdgeSwapConfig } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { getSwapPluginIcon } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type ModalResult = { type: 'cancel' } | { type: 'select', pluginId: string | void }

type Props = {
  bridge: AirshipBridge<ModalResult>,
  exchanges: EdgePluginMap<EdgeSwapConfig>,
  selected: string | void
}

/**
 * Allows the user to select one of the enabled exchanges,
 * or none to get the best price.
 */
export function SwapPreferredModal(props: Props) {
  const { bridge, exchanges, selected } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const sortedIds = Object.keys(exchanges)
    .sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
    .filter(pluginId => exchanges[pluginId].enabled)

  function renderRow(pluginId: string | void): React.Node {
    let check: React.Node | void
    if (selected === pluginId) {
      check = <AntDesignIcon name="check" color={theme.positiveText} size={theme.rem(1.25)} style={styles.icon} />
    }

    const { text, icon } =
      pluginId != null
        ? {
            text: exchanges[pluginId].swapInfo.displayName,
            icon: <Image resizeMode="contain" style={styles.icon} source={getSwapPluginIcon(pluginId)} />
          }
        : {
            text: s.strings.swap_preferred_cheapest,
            icon: <AntDesignIcon name="barschart" color={theme.icon} size={theme.rem(1.25)} style={styles.icon} />
          }

    return (
      <TouchableOpacity onPress={() => bridge.resolve({ type: 'select', pluginId })}>
        <View style={styles.row}>
          {icon}
          <EdgeText style={styles.rowText}>{text}</EdgeText>
          {check}
        </View>
      </TouchableOpacity>
    )
  }

  const handleCancel = () => bridge.resolve({ type: 'cancel' })

  // ScrollView maxHeight is computed by how many plugins
  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle>{s.strings.swap_preferred_header}</ModalTitle>
      <ScrollView style={{ maxHeight: (sortedIds.length + 1) * theme.rem(2.25) }}>
        {renderRow(undefined)}
        {sortedIds.map(pluginId => renderRow(pluginId))}
      </ScrollView>
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    height: theme.rem(2.25),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  icon: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    margin: theme.rem(0.5)
  },
  rowText: {
    flexGrow: 1,
    margin: theme.rem(0.5)
  }
}))
