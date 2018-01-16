import React, {Component} from 'react'
import {
  FlatList,
  View
} from 'react-native'

import style from './styles'
import platform from '../../../../theme/variables/platform.js'

export default class SearchResults extends Component {
  constructor (props) {
    super(props)
    const completedDataList = this.props.regularArray.map((x, i) => {
      const newValue = x
      newValue.key = i
      return newValue
    })
    this.state = {
      dataSource: completedDataList
    }
  }

  render () {
    let searchResultsHeight
    if (this.props.dimensions.keyboardHeight) {
      searchResultsHeight = this.props.height + platform.toolbarHeight - this.props.dimensions.keyboardHeight
    } else {
      searchResultsHeight = this.props.height
    }
    return (
      <View style={[
        style.searchResultsContainer,
        {
          height: searchResultsHeight,
          width: platform.deviceWidth,
          top: platform.toolbarHeight + this.props.extraTopSpace,
          zIndex: 999
        },
        this.props.containerStyle]}>
          <FlatList
            style={[{width: '100%'}]}
            data={this.props.regularArray}
            renderItem={(rowData) => this.props.renderRegularResultFxn(rowData, this.props.onRegularSelectFxn)}
            initialNumToRender={this.props.initialNumToRender || 12}
            scrollRenderAheadDistance={this.props.scrollRenderAheadDistance || 800}
            keyExtractor={this.props.keyExtractor}
            overScrollMode='never'
            keyboardShouldPersistTaps='handled'
        />
      </View>
    )
  }

  renderRegularRow = (data, onPressFxn) => this.props.regularResult(data, onPressFxn)
}
