import React, {Component} from 'react'
import {
  View,
  ListView,
  TouchableOpacity,
  TextInput
} from 'react-native'
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
  }

  handleSelectListItem = (item) => {
    this.setState({
      searchTerm: item.label,
      isListVisible: false
    })
    this.props.onSelect(item)
  }
  handleSearchTermChange = (searchTerm) => this.setState({isListVisible: true, searchTerm})
  handleOnFocus = () => this.setState({isListVisible: true})
  handleOnBlur = () => this.setState({isListVisible: false})

  getMatchingListItems = () => {
    const {searchTerm} = this.state
    const normalizedSearchTerm = searchTerm.toLowerCase()
    return this.props.listItems.filter((listItem) =>
      listItem.label
      .toLowerCase()
      .includes(normalizedSearchTerm))
  }

  render () {
    return (
      <View style={styles.pickerView}>
        <TextInput style={styles.picker}
          clearButtonMode={'while-editing'}
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          autoCorrect={false}
          autoCapitalize={'words'}
          onChangeText={this.handleSearchTermChange}
          value={this.state.searchTerm}
          placeholder={this.props.placeholder} />

          {this.state.isListVisible
            && <DropdownList
              dataSource={this.getMatchingListItems()}
              onPress={this.handleSelectListItem} />}
      </View>
    )
  }
}

// //////////////////////////// DropdownList ///////////////////////////////////

const DropdownList = (props) => {
  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  const dataSource = ds.cloneWithRows(props.dataSource)
  const onPress = (item) => () => props.onPress(item)
  const renderRow = (item) => <TouchableOpacity
    style={{backgroundColor: 'white', padding: 10}}
    onPress={onPress(item)}>
    <T>{item.label}</T>
  </TouchableOpacity>

  return <View style={styles.listView}>
    <ListView
      keyboardShouldPersistTaps={'always'}
      style={styles.listView}
      dataSource={dataSource}
      renderRow={renderRow} />
  </View>
}
