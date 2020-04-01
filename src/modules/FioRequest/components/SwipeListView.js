// @flow

import React, { Component } from 'react'
import { FlatList, ListView, Platform, SectionList } from 'react-native'

import SwipeRow from './SwipeRow'

type Props = {
  scrollEnabled?: boolean,
  onScrollEnabled?: Function,
  closeOnRowBeginSwipe?: boolean,
  swipeGestureBegan?: Function,
  closeOnRowOpen?: boolean,
  onRowOpen?: Function,
  closeOnRowPress?: boolean,
  closeOnScroll?: boolean,
  onScroll?: Function,
  onLayout?: Function,
  useFlatList?: any,
  useSectionList?: any,
  onContentSizeChange?: Function,
  listViewRef?: any,
  onRowDidOpen?: Function,
  renderRow?: Function,
  onRowClose?: Function,
  onRowDidClose?: Function,
  onSwipeValueChange?: Function,
  shouldItemUpdate?: Function,
  leftOpenValue: any,
  rightOpenValue?: any,
  disableLeftSwipe?: any,
  disableRightSwipe?: any,
  stopLeftSwipe?: any,
  stopRightSwipe?: any,
  recalculateHiddenLayout?: any,
  swipeRowStyle?: any,
  previewDuration?: any,
  previewOpenDelay?: any,
  previewOpenValue?: any,
  tension?: any,
  friction?: any,
  directionalDistanceChangeThreshold?: any,
  swipeToOpenPercent?: any,
  swipeToOpenVelocityContribution?: any,
  swipeToClosePercent?: any,
  renderHiddenRow?: Function,
  dataSource?: any,
  previewFirstRow?: any,
  previewRowIndex?: any,
  renderItem?: Function,
  renderHiddenItem?: Function,
  keyExtractor?: Function,
  previewRowKey?: any,
  renderListView?: Function
}

type State = {}

type ListViewProps = {
  onLayout(any): any,
  onContentSizeChange(w: number, h: number): any
}

/**
 * ListView that renders SwipeRows.
 */
class SwipeListView extends Component<Props, State> {
  static defaultProps: Props = {
    leftOpenValue: 0,
    rightOpenValue: 0,
    closeOnRowBeginSwipe: false,
    closeOnScroll: true,
    closeOnRowPress: true,
    closeOnRowOpen: true,
    disableLeftSwipe: false,
    disableRightSwipe: false,
    recalculateHiddenLayout: false,
    previewFirstRow: false,
    directionalDistanceChangeThreshold: 2,
    swipeToOpenPercent: 50,
    swipeToOpenVelocityContribution: 0,
    swipeToClosePercent: 50
  }

  _rows = {}
  _listView = null
  openCellKey: any = 1
  yScrollOffset = 0
  layoutHeight = 0
  listViewProps: ListViewProps = {
    onLayout: () => {},
    onContentSizeChange: () => {}
  }

  constructor (props: Props) {
    super(props)
    if (Platform.OS === 'ios') {
      // Keep track of scroll offset and layout changes on iOS to be able to handle
      // https://github.com/jemise111/react-native-swipe-list-view/issues/109
      this.listViewProps = {
        onLayout: e => this.onLayout(e),
        onContentSizeChange: (w, h) => this.onContentSizeChange(w, h)
      }
    }
  }

  setScrollEnabled (enable: boolean) {
    if (this.props.scrollEnabled === false) {
      return
    }
    // Due to multiple issues reported across different versions of RN
    // We do this in the safest way possible...
    if (this._listView && this._listView.setNativeProps) {
      this._listView.setNativeProps({ scrollEnabled: enable })
    } else if (this._listView && this._listView.getScrollResponder) {
      const scrollResponder = this._listView.getScrollResponder()
      scrollResponder.setNativeProps && scrollResponder.setNativeProps({ scrollEnabled: enable })
    }
    this.props.onScrollEnabled && this.props.onScrollEnabled(enable)
  }

  safeCloseOpenRow () {
    const rowRef = this._rows[this.openCellKey]
    if (rowRef && rowRef.closeRow) {
      this._rows[this.openCellKey].closeRow()
    }
  }

  rowSwipeGestureBegan (key: string) {
    if (this.props.closeOnRowBeginSwipe && this.openCellKey && this.openCellKey !== key) {
      this.safeCloseOpenRow()
    }

    if (this.props.swipeGestureBegan) {
      this.props.swipeGestureBegan(key)
    }
  }

  onRowOpen (key: string, toValue: string) {
    if (this.openCellKey && this.openCellKey !== key && this.props.closeOnRowOpen && !this.props.closeOnRowBeginSwipe) {
      this.safeCloseOpenRow()
    }
    this.openCellKey = key
    this.props.onRowOpen && this.props.onRowOpen(key, this._rows, toValue)
  }

  onRowPress () {
    if (this.openCellKey) {
      if (this.props.closeOnRowPress) {
        this.safeCloseOpenRow()
        this.openCellKey = null
      }
    }
  }

  onScroll (e: any) {
    if (Platform.OS === 'ios') {
      this.yScrollOffset = e.nativeEvent.contentOffset.y
    }
    if (this.openCellKey) {
      if (this.props.closeOnScroll) {
        this.safeCloseOpenRow()
        this.openCellKey = null
      }
    }
    this.props.onScroll && this.props.onScroll(e)
  }

  onLayout (e: any) {
    this.layoutHeight = e.nativeEvent.layout.height
    this.props.onLayout && this.props.onLayout(e)
  }

  // When deleting rows on iOS, the list may end up being over-scrolled,
  // which will prevent swiping any of the remaining rows. This triggers a scrollToEnd
  // when that happens, which will make sure the list is kept in bounds.
  // See: https://github.com/jemise111/react-native-swipe-list-view/issues/109
  onContentSizeChange (w: number, h: number) {
    const { useFlatList, useSectionList } = this.props
    const height = h - this.layoutHeight
    if (this.yScrollOffset >= height && height > 0) {
      if (!useFlatList && !useSectionList && this._listView instanceof ListView) {
        this._listView && this._listView.getScrollResponder().scrollToEnd()
      }
      if (this._listView instanceof FlatList) {
        this._listView && this._listView.scrollToEnd()
      }
    }
    this.props.onContentSizeChange && this.props.onContentSizeChange(w, h)
  }

  setRefs (ref: any) {
    this._listView = ref
    this.props.listViewRef && this.props.listViewRef(ref)
  }

  renderCell (VisibleComponent: any, HiddenComponent: any, key: string, item: any, shouldPreviewRow?: boolean) {
    if (!HiddenComponent) {
      return React.cloneElement(VisibleComponent, {
        ...VisibleComponent.props,
        ref: row => {
          this._rows[key] = row
        },
        onRowOpen: toValue => this.onRowOpen(key, toValue),
        onRowDidOpen: toValue => this.props.onRowDidOpen && this.props.onRowDidOpen(key, this._rows, toValue),
        onRowClose: () => this.props.onRowClose && this.props.onRowClose(key, this._rows),
        onRowDidClose: () => this.props.onRowDidClose && this.props.onRowDidClose(key, this._rows),
        onRowPress: () => this.onRowPress(),
        setScrollEnabled: enable => this.setScrollEnabled(enable),
        swipeGestureBegan: () => this.rowSwipeGestureBegan(key)
      })
    } else {
      return (
        <SwipeRow
          onSwipeValueChange={data => (this.props.onSwipeValueChange ? this.props.onSwipeValueChange({ ...data, key }) : null)}
          ref={row => {
            this._rows[key] = row
          }}
          swipeGestureBegan={() => this.rowSwipeGestureBegan(key)}
          onRowOpen={toValue => this.onRowOpen(key, toValue)}
          onRowDidOpen={toValue => this.props.onRowDidOpen && this.props.onRowDidOpen(key, this._rows, toValue)}
          onRowClose={() => this.props.onRowClose && this.props.onRowClose(key, this._rows)}
          onRowDidClose={() => this.props.onRowDidClose && this.props.onRowDidClose(key, this._rows)}
          onRowPress={() => this.onRowPress()}
          shouldItemUpdate={(currentItem, newItem) => (this.props.shouldItemUpdate ? this.props.shouldItemUpdate(currentItem, newItem) : null)}
          setScrollEnabled={enable => this.setScrollEnabled(enable)}
          leftOpenValue={item.leftOpenValue || this.props.leftOpenValue}
          rightOpenValue={item.rightOpenValue || this.props.rightOpenValue}
          closeOnRowPress={item.closeOnRowPress || this.props.closeOnRowPress}
          disableLeftSwipe={item.disableLeftSwipe || this.props.disableLeftSwipe}
          disableRightSwipe={item.disableRightSwipe || this.props.disableRightSwipe}
          stopLeftSwipe={item.stopLeftSwipe || this.props.stopLeftSwipe}
          stopRightSwipe={item.stopRightSwipe || this.props.stopRightSwipe}
          recalculateHiddenLayout={this.props.recalculateHiddenLayout}
          style={this.props.swipeRowStyle}
          preview={shouldPreviewRow}
          previewDuration={this.props.previewDuration}
          previewOpenDelay={this.props.previewOpenDelay}
          previewOpenValue={this.props.previewOpenValue}
          tension={this.props.tension}
          friction={this.props.friction}
          directionalDistanceChangeThreshold={this.props.directionalDistanceChangeThreshold || 0}
          swipeToOpenPercent={this.props.swipeToOpenPercent || 0}
          swipeToOpenVelocityContribution={this.props.swipeToOpenVelocityContribution}
          swipeToClosePercent={this.props.swipeToClosePercent || 0}
          item={item} // used for should item update comparisons
        >
          {HiddenComponent}
          {VisibleComponent}
        </SwipeRow>
      )
    }
  }

  renderRow (rowData: any, secId: number, rowId: number, rowMap: any) {
    const key = `${secId}${rowId}`
    const Component = this.props.renderRow && this.props.renderRow(rowData, secId, rowId, rowMap)
    const HiddenComponent = this.props.renderHiddenRow && this.props.renderHiddenRow(rowData, secId, rowId, rowMap)
    const previewRowId = this.props.dataSource && this.props.dataSource.getRowIDForFlatIndex(this.props.previewRowIndex || 0)
    const shouldPreviewRow = (this.props.previewFirstRow || this.props.previewRowIndex) && rowId === previewRowId

    return this.renderCell(Component, HiddenComponent, key, rowData, shouldPreviewRow)
  }

  renderItem (rowData: any, rowMap: any) {
    const Component = this.props.renderItem && this.props.renderItem(rowData, rowMap)
    const HiddenComponent = this.props.renderHiddenItem && this.props.renderHiddenItem(rowData, rowMap)
    const { item, index } = rowData
    let { key } = item
    if (!key && this.props.keyExtractor) {
      key = this.props.keyExtractor(item, index)
    }

    const shouldPreviewRow = typeof key !== 'undefined' && this.props.previewRowKey === key

    return this.renderCell(Component, HiddenComponent, key, item, shouldPreviewRow)
  }

  render () {
    const { useFlatList, useSectionList, renderListView, ...props } = this.props

    if (renderListView) {
      return renderListView(
        props,
        this.setRefs.bind(this),
        this.onScroll.bind(this),
        useFlatList || useSectionList ? this.renderItem.bind(this) : this.renderRow.bind(this, this._rows)
      )
    }

    if (useFlatList) {
      return (
        <FlatList
          {...props}
          {...this.listViewProps}
          ref={c => this.setRefs(c)}
          onScroll={e => this.onScroll(e)}
          renderItem={rowData => this.renderItem(rowData, this._rows)}
        />
      )
    }

    if (useSectionList) {
      return (
        <SectionList
          {...props}
          {...this.listViewProps}
          ref={c => this.setRefs(c)}
          onScroll={e => this.onScroll(e)}
          renderItem={rowData => this.renderItem(rowData, this._rows)}
        />
      )
    }

    return (
      <ListView
        {...props}
        {...this.listViewProps}
        ref={c => this.setRefs(c)}
        onScroll={e => this.onScroll(e)}
        renderRow={(rowData, secId, rowId) => this.renderRow(rowData, secId, rowId, this._rows)}
      />
    )
  }
}

export default SwipeListView
