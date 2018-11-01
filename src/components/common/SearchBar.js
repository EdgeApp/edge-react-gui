/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { Animated, Text, TextInput, TouchableHighlight, View } from 'react-native'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import styles from '../../styles/scenes/TransactionListStyle'

const CANCEL_TEXT = sprintf(s.strings.string_cancel_cap)
const SEARCH_PLACEHOLDER_TEXT = sprintf(s.strings.string_search)

export default class SearchBar extends Component {
  constructor (props) {
    super(props)
    this.state = this.props.state
  }

  render () {
    return (
      <View style={[styles.searchContainer]}>
        <View style={[styles.innerSearch]}>
          <EvilIcons style={[styles.searchIcon]} name="search" size={20} />
          <TextInput
            style={[styles.searchInput]}
            onChangeText={this.props.onSearchChange}
            onBlur={this.props.onBlur}
            onFocus={this.props.onFocus}
            placeholder={SEARCH_PLACEHOLDER_TEXT}
          />
        </View>

        <Animated.View style={{ width: this.state.animation, opacity: this.state.op }}>
          <TouchableHighlight style={[styles.cancelButton]} onPress={this.props.onPress}>
            <Text style={styles.cancelButtonText}>{CANCEL_TEXT}</Text>
          </TouchableHighlight>
        </Animated.View>
      </View>
    )
  }
}
