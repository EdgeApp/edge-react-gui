/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { KeyboardAvoidingView, ListView, TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import { FormField } from '../../../../components/common/FormField.js'
import T from '../../components/FormattedText'
import styles from './styles.js'

export default class DropdownPicker extends Component {
  constructor (props) {
    super(props)

    this.state = {
      searchTerm: '',
      isListVisible: props.startOpen,
      selectedItem: ''
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  handleSelectListItem = item => {
    this.setState({
      searchTerm: item.label,
      isListVisible: false
    })
    this.props.onSelect(item)
  }
  handleSearchTermChange = searchTerm => {
    this.setState({
      isListVisible: true,
      searchTerm
    })
  }
  handleOnFocus = () => {
    this.setState({ isListVisible: true })
  }
  handleOnBlur = () => {
    this.setState({ isListVisible: false })
  }

  getMatchingListItems = () => {
    const { searchTerm } = this.state
    const normalizedSearchTerm = searchTerm.toLowerCase()
    return this.props.listItems.filter(listItem => listItem.label.toLowerCase().includes(normalizedSearchTerm))
  }

  render () {
    return (
      <View style={styles.pickerView}>
        <FormField
          style={styles.picker}
          autoFocus={this.props.autoFocus}
          clearButtonMode={'while-editing'}
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          autoCorrect={false}
          autoCapitalize={'words'}
          onChangeText={this.handleSearchTermChange}
          value={this.state.searchTerm}
          label={this.props.placeholder}
        />

        {this.state.isListVisible && <DropdownList style={this.props.listStyle} dataSource={this.getMatchingListItems()} onPress={this.handleSelectListItem} />}
      </View>
    )
  }
}

// //////////////////////////// DropdownList ///////////////////////////////////

const DropdownList = props => {
  const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })
  const dataSource = ds.cloneWithRows(props.dataSource)
  const onPress = item => () => props.onPress(item)
  const renderRow = item => (
    <TouchableOpacity style={styles.row} onPress={onPress(item)}>
      <T>{item.label}</T>
    </TouchableOpacity>
  )

  return (
    <KeyboardAvoidingView keyboardVerticalOffset={60} contentContainerStyle={props.style} behavior={'height'}>
      <ListView keyboardShouldPersistTaps={'always'} style={props.style} dataSource={dataSource} renderRow={renderRow} />
    </KeyboardAvoidingView>
  )
}
