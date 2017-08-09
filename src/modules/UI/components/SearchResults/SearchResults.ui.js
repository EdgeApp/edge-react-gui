import React, { PropTypes, Component } from 'react'
import {
  FlatList,
  View
} from 'react-native'
import style from './styles'

class SearchResults extends Component {
  constructor (props) {
    super(props)
    let completedDataList = this.props.regularArray.map((x, i) => {
      let newValue = x
      newValue.key = i
      return newValue
    })
    this.state = {
      dataSource: completedDataList
    }
  }

  render () {
    let completedDataList = this.props.regularArray.map((x, i) => {
      let newValue = x
      newValue.key = i
      return newValue
    })
    return (
      <View style={[style.searchResultsContainer, {backgroundColor: 'white', height: this.props.height, width: this.props.dimensions.deviceDimensions.width, top: this.props.dimensions.headerHeight + this.props.extraTopSpace, zIndex: 999}]}>
        <FlatList
          style={[{width: '100%'}]}
          data={completedDataList}
          renderItem={(rowData) => this.props.renderRegularResultFxn(rowData, this.props.onRegularSelectFxn)}
          initialNumToRender={20}
          scrollRenderAheadDistance={800}
          keyExtractor={this.props.keyExtractor}
          overScrollMode='never'
        />
      </View>
    )
  }

  renderRegularRow = (data, onPressFxn) => {
    return this.props.regularResult(data, onPressFxn)
  }
}

SearchResults.propTypes = {
  onRegularSelect: PropTypes.func,
  regularData: PropTypes.object,
  usableHeight: PropTypes.number
}

export default SearchResults
