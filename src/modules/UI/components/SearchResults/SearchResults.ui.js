import React, { PropTypes, Component } from 'react'
import {
  FlatList
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

/*  componentDidMount () {
    let completedContactList = this.props.regularArray.map((x, i) => {
      let newValue = x.newValue.key = i
      return newValue
    })
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    console.log('ds is: ', ds)
    this.setState({dataSource: ds.cloneWithRows(completedContactList || [])})
  }
*/
  render () {
    console.log('rendering SearchResults, this.props is: ', this.props, ' , and this.state is: ', this.state)
    let completedDataList = this.props.regularArray.map((x, i) => {
      let newValue = x
      newValue.key = i
      return newValue
    })
    console.log('completedDataList is: ', completedDataList)
    return (
      <FlatList
        style={[style.searchResultsContainer, {height: this.props.height, width: this.props.dimensions.deviceDimensions.width, top: this.props.dimensions.headerHeight + this.props.extraTopSpace, zIndex: 999}]}
        data={completedDataList}
        // ListHeaderComponent={(rowData) => this.props.renderHeaderResultFxn(rowData, this.props.onHeaderSelectFxn)}
        renderItem={(rowData) => this.props.renderRegularResultFxn(rowData, this.props.onRegularSelectFxn)}
        initialNumToRender={20}
        scrollRenderAheadDistance={800}
        keyExtractor={this.props.keyExtractor}
        overScrollMode='never'
      />
    )
  }

  renderRegularRow = (data, onPressFxn) => {
    console.log('in renderRegularRow, data is: ', data, ' , and onPressFxn is: ', onPressFxn)
    return this.props.regularResult(data, onPressFxn)
  }
}

SearchResults.propTypes = {
  onRegularSelect: PropTypes.func,
  regularData: PropTypes.object,
  usableHeight: PropTypes.number
}

export default SearchResults
