import React, { PropTypes, Component } from 'react'
import {
  ListView
} from 'react-native'
import style from './styles'

class SearchResults extends Component {
  constructor (props) {
    super(props)
    let completedContactList = this.props.regularArray.map((x, i) => {
      let newValue = x
      newValue.key = i
      return newValue
    })
    let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    console.log('constructor ds is: ', ds)
    this.state = {
      dataSource: ds.cloneWithRows(completedContactList)
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
    let completedContactList = this.props.regularArray.map((x, i) => {
      let newValue = x
      newValue.key = i
      return newValue
    })
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    console.log('ds is: ', ds)
    const completedDataSource = ds.cloneWithRows(completedContactList)
    console.log('rendering SearchResults, this.props is: ', this.props, ' , and this.state is: ', this.state, ' and completedDataSource is: ', completedDataSource)
    return (
      <ListView
        keyboardShouldPersistTaps='always'
        style={[style.searchResultsContainer, {height: this.props.usableHeight}]}
        dataSource={completedDataSource}
        renderRow={(rowData) => this.props.renderRegularResultFxn(rowData, this.props.onRegularSelectFxn)}
        initialListSize={20}
        scrollRenderAheadDistance={800}
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
