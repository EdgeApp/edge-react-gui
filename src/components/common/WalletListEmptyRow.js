// @flow

import React, { Component } from 'react'
import { ActivityIndicator, TouchableHighlight, View } from 'react-native'

import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle.js'

export class WalletListEmptyRow extends Component<{}> {
  render () {
    return (
      <TouchableHighlight style={[styles.rowContainer, styles.emptyRow]} underlayColor={styleRaw.emptyRowUnderlay.color}>
        <View style={styles.rowContent}>
          <View style={styles.rowNameTextWrap}>
            <ActivityIndicator style={{ height: 18, width: 18 }} />
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
