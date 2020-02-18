// @flow

import { type EdgePluginMap, type EdgeSwapConfig } from 'edge-core-js/types'
import React, { type Node, Fragment } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { getSwapPluginIcon } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { type AirshipBridge, AirshipModal, dayText, THEME } from './modalParts.js'

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
export function SwapPreferredModal (props: Props) {
  const { bridge, exchanges, selected } = props

  const sortedIds = Object.keys(exchanges)
    .sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
    .filter(pluginId => exchanges[pluginId].enabled)

  function renderRow (pluginId: string | void): Node {
    let check: Node | void
    if (selected === pluginId) {
      check = <AntDesignIcon name="check" color={THEME.COLORS.GRAY_1} size={iconSize} style={styles.icon} />
    }

    const { text, icon } =
      pluginId != null
        ? {
          text: exchanges[pluginId].swapInfo.displayName,
          icon: <Image resizeMode="contain" style={styles.icon} source={getSwapPluginIcon(pluginId)} />
        }
        : {
          text: s.strings.swap_preferred_cheapest,
          icon: <AntDesignIcon name="barschart" color={THEME.COLORS.GRAY_1} size={iconSize} style={styles.icon} />
        }

    return (
      <TouchableOpacity onPress={() => bridge.resolve({ type: 'select', pluginId })}>
        <View style={styles.row}>
          {icon}
          <Text style={styles.rowText}>{text}</Text>
          {check}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <AirshipModal bridge={bridge} padding={margin} onCancel={() => bridge.resolve({ type: 'cancel' })}>
      {gap => (
        <Fragment>
          <Text style={styles.headerText}>{s.strings.swap_preferred_header}</Text>
          <ScrollView style={{ marginBottom: -gap.bottom }} contentContainerStyle={{ paddingBottom: gap.bottom }}>
            {renderRow(undefined)}
            {sortedIds.map(pluginId => renderRow(pluginId))}
          </ScrollView>
        </Fragment>
      )}
    </AirshipModal>
  )
}

const margin = THEME.rem(0.5)
const iconSize = THEME.rem(1.375)

const rawStyles = {
  row: {
    // Appearance:
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,

    // Layout:
    minHeight: THEME.rem(3),
    paddingLeft: THEME.rem(0.5),
    paddingRight: THEME.rem(0.5),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  headerText: { ...dayText('title'), margin },
  icon: { height: iconSize, width: iconSize, margin },
  rowText: { ...dayText(), flexGrow: 1, margin }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
