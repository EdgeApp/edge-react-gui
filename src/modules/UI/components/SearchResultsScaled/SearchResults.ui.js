// @flow

import React, { Component } from 'react'
import { FlatList, View } from 'react-native'

import { scale } from '../../../../lib/scaling'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { DeviceDimensions } from '../../../../types.js'
import style from './styles'

export type Props = {
  regularArray: Array<any>,
  filterArray: Array<any>,
  dimensions: DeviceDimensions,
  height: number,
  extraTopSpace: number,
  containerStyle: Object,
  onRegularSelectFxn: string => void,
  scrollRenderAheadDistance: number,
  renderRegularResultFxn: (rowData: any, onRegularSelectFxn: (any) => void, filterArray: Array<any>) => void,
  keyExtractor: Object => number,
  regularResult: (data: Object, onPressFxn: () => void) => void
}
export type State = {
  dataSource: Array<Object>
}
export default class SearchResults extends Component<Props, State> {
  constructor (props: Props) {
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
      searchResultsHeight = this.props.height + PLATFORM.toolbarHeight - this.props.dimensions.keyboardHeight
    } else {
      searchResultsHeight = this.props.height
    }
    return (
      <View
        style={[
          style.searchResultsContainer,
          {
            height: searchResultsHeight,
            width: PLATFORM.deviceWidth,
            top: scale(PLATFORM.toolbarHeight + this.props.extraTopSpace),
            zIndex: 999
          },
          this.props.containerStyle
        ]}
      >
        <FlatList
          style={[{ width: '100%' }]}
          data={this.props.regularArray}
          renderItem={rowData => this.props.renderRegularResultFxn(rowData, this.props.onRegularSelectFxn, this.props.filterArray)}
          initialNumToRender={this.props.initialNumToRender || 12}
          scrollRenderAheadDistance={this.props.scrollRenderAheadDistance || 800}
          keyExtractor={this.props.keyExtractor}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        />
      </View>
    )
  }

  renderRegularRow = (data: Object, onPressFxn: () => void) => this.props.regularResult(data, onPressFxn)
}
