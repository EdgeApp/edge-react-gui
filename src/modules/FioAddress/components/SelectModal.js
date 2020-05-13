// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import React, { Component, Fragment } from 'react'
import { FlatList, Image, TouchableHighlight, View } from 'react-native'

import fioAddressListIcon from '../../../assets/images/list_fioAddress.png'
import { type AirshipBridge, AirshipModal } from '../../../components/modals/modalParts.js'
import { CryptoExchangeWalletListRowStyle as styles } from '../../../styles/components/CryptoExchangeWalletListRowStyle.js'
import type { FlatListItem } from '../../../types/types.js'
import { scale } from '../../../util/scaling.js'
import T from '../../UI/components/FormattedText/index'

type Item = {
  label: string,
  value: any,
  key?: string
}

type Props = {
  bridge: AirshipBridge<string>,
  headerTitle: string,
  items: Item[]
}

type State = {
  input: string
}

export class SelectModal extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: ''
    }
  }

  getWalletRecords = () => {
    const { items } = this.props
    const { input } = this.state

    if (input === '') {
      return items
    }

    // Search Input Filter
    const inputLowerCase = input.toLowerCase()
    const filteredRecords = []
    for (const item of items) {
      const { label, value } = item

      if (value) {
        const labelString = label.toLowerCase()
        if (labelString.includes(inputLowerCase)) {
          filteredRecords.push(item)
        }
      }
    }
    return filteredRecords
  }

  selectItem = (value: any) => this.props.bridge.resolve(value)
  renderItem = ({ item }: FlatListItem<Item>) => {
    const { value, label } = item
    if (value) {
      return (
        <TouchableHighlight style={styles.touchable} onPress={() => this.selectItem(value)} underlayColor={styles.underlayColor}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              <Image style={styles.imageContainer} source={fioAddressListIcon} resizeMode="contain" />
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={styles.walletDetailsRowName}>{label}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  keyExtractor = (item: Item, index: number) => index.toString()
  onSearchFilterChange = (input: string) => this.setState({ input })
  render() {
    const { bridge, headerTitle } = this.props
    const { input } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve('')}>
        {gap => (
          <>
            <View style={{ flex: 1 }}>
              <View style={{ marginHorizontal: scale(15), marginBottom: scale(13) }}>
                <FormField
                  autoFocus
                  keyboardType="default"
                  label={headerTitle}
                  onChangeText={this.onSearchFilterChange}
                  style={MaterialInputStyle}
                  value={input}
                />
              </View>
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={this.getWalletRecords()}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this.renderItem}
              />
            </View>
          </>
        )}
      </AirshipModal>
    )
  }
}
