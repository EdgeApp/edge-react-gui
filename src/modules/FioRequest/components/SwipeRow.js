// @flow

import React, { Component } from 'react'
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native'

const DEFAULT_PREVIEW_OPEN_DELAY = 700
const MAX_VELOCITY_CONTRIBUTION = 5
const PREVIEW_CLOSE_DELAY = 300
const SCROLL_LOCK_MILLISECONDS = 300

/**
 * Row that is generally used in a SwipeListView.
 * If you are rendering a SwipeRow explicitly you must pass the SwipeRow exactly two children.
 * The first will be rendered behind the second.
 * e.g.
 <SwipeRow>
 <View style={hiddenRowStyle} />
 <View style={visibleRowStyle} />
 </SwipeRow>
 */

type Props = {
  onSwipeValueChange?: Function,
  shouldItemUpdate?: Function,
  item?: any,
  previewDuration?: any,
  recalculateHiddenLayout?: any,
  preview?: boolean,
  previewOpenValue?: any,
  rightOpenValue: any,
  previewOpenDelay?: any,
  onRowPress?: Function,
  closeOnRowPress?: boolean,
  directionalDistanceChangeThreshold: number,
  setScrollEnabled?: Function,
  swipeGestureBegan?: Function,
  disableLeftSwipe?: boolean,
  disableRightSwipe?: boolean,
  stopLeftSwipe?: number,
  stopRightSwipe?: number,
  swipeToOpenVelocityContribution?: number,
  leftOpenValue: number,
  swipeToOpenPercent: number,
  swipeToClosePercent: number,
  friction?: any,
  tension?: any,
  onRowDidClose?: Function,
  onRowDidOpen?: Function,
  onRowClose?: Function,
  onRowOpen?: Function,
  children: any,
  style?: any
}

type State = {
  dimensionsSet: boolean,
  hiddenHeight: number,
  hiddenWidth: number
}

class SwipeRow extends Component<Props, State> {
  static defaultProps: Props = {
    leftOpenValue: 0,
    rightOpenValue: 0,
    closeOnRowPress: true,
    disableLeftSwipe: false,
    disableRightSwipe: false,
    recalculateHiddenLayout: false,
    preview: false,
    previewDuration: 300,
    previewOpenDelay: DEFAULT_PREVIEW_OPEN_DELAY,
    directionalDistanceChangeThreshold: 2,
    swipeToOpenPercent: 50,
    swipeToOpenVelocityContribution: 0,
    swipeToClosePercent: 50,
    item: {},
    children: []
  }

  isOpen: boolean = false
  previousTrackedTranslateX: number = 0
  previousTrackedDirection: any = null
  horizontalSwipeGestureBegan: boolean = false
  swipeInitialX: any = null
  parentScrollEnabled: boolean = true
  ranPreview: boolean = false
  _ensureScrollEnabledTimer: any = null
  _translateX: any = new Animated.Value(0)
  _panResponder: any

  constructor (props: Props) {
    super(props)
    this.state = {
      dimensionsSet: false,
      hiddenHeight: 0,
      hiddenWidth: 0
    }

    if (props.onSwipeValueChange) {
      this._translateX.addListener(({ value }) => {
        let direction = this.previousTrackedDirection
        if (value !== this.previousTrackedTranslateX) {
          direction = value > this.previousTrackedTranslateX ? 'right' : 'left'
        }
        this.props.onSwipeValueChange &&
          this.props.onSwipeValueChange({
            isOpen: this.isOpen,
            direction,
            value
          })
        this.previousTrackedTranslateX = value
        this.previousTrackedDirection = direction
      })
    }
  }

  UNSAFE_componentWillMount () {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gs) => this.handleOnMoveShouldSetPanResponder(e, gs),
      onPanResponderMove: (e, gs) => this.handlePanResponderMove(e, gs),
      onPanResponderRelease: (e, gs) => this.handlePanResponderEnd(e, gs),
      onPanResponderTerminate: (e, gs) => this.handlePanResponderEnd(e, gs),
      onShouldBlockNativeResponder: _ => false
    })
  }

  componentWillUnmount () {
    clearTimeout(this._ensureScrollEnabledTimer)
    this._translateX.removeAllListeners()
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    if (
      this.state.hiddenHeight !== nextState.hiddenHeight ||
      this.state.hiddenWidth !== nextState.hiddenWidth ||
      !this.props.shouldItemUpdate ||
      (this.props.shouldItemUpdate && this.props.shouldItemUpdate(this.props.item, nextProps.item))
    ) {
      return true
    }

    return false
  }

  getPreviewAnimation (toValue: any, delay: any) {
    return Animated.timing(this._translateX, { duration: this.props.previewDuration, toValue, delay })
  }

  onContentLayout (e: any) {
    this.setState({
      dimensionsSet: !this.props.recalculateHiddenLayout,
      hiddenHeight: e.nativeEvent.layout.height,
      hiddenWidth: e.nativeEvent.layout.width
    })

    if (this.props.preview && !this.ranPreview) {
      this.ranPreview = true
      const previewOpenValue = this.props.previewOpenValue || this.props.rightOpenValue * 0.5
      this.getPreviewAnimation(previewOpenValue, this.props.previewOpenDelay).start(_ => {
        this.getPreviewAnimation(0, PREVIEW_CLOSE_DELAY).start()
      })
    }
  }

  onRowPress () {
    if (this.props.onRowPress) {
      this.props.onRowPress()
    } else {
      if (this.props.closeOnRowPress) {
        this.closeRow()
      }
    }
  }

  handleOnMoveShouldSetPanResponder (e: any, gs: any) {
    const { dx } = gs
    return Math.abs(dx) > this.props.directionalDistanceChangeThreshold
  }

  handlePanResponderMove (e: any, gestureState: any) {
    const { dx, dy } = gestureState
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // this check may not be necessary because we don't capture the move until we pass the threshold
    // just being extra safe here
    if (absDx > this.props.directionalDistanceChangeThreshold || absDy > this.props.directionalDistanceChangeThreshold) {
      // we have enough to determine direction
      if (absDy > absDx && !this.horizontalSwipeGestureBegan) {
        // user is moving vertically, do nothing, listView will handle
        return
      }

      // user is moving horizontally
      if (this.parentScrollEnabled) {
        // disable scrolling on the listView parent
        this.parentScrollEnabled = false
        this.props.setScrollEnabled && this.props.setScrollEnabled(false)
      }

      if (this.swipeInitialX === null) {
        // set tranlateX value when user started swiping
        this.swipeInitialX = this._translateX._value
      }
      if (!this.horizontalSwipeGestureBegan) {
        this.horizontalSwipeGestureBegan = true
        this.props.swipeGestureBegan && this.props.swipeGestureBegan()
      }

      let newDX = this.swipeInitialX + dx
      if (this.props.disableLeftSwipe && newDX < 0) {
        newDX = 0
      }
      if (this.props.disableRightSwipe && newDX > 0) {
        newDX = 0
      }

      if (this.props.stopLeftSwipe && newDX > this.props.stopLeftSwipe) {
        newDX = this.props.stopLeftSwipe
      }
      if (this.props.stopRightSwipe && newDX < this.props.stopRightSwipe) {
        newDX = this.props.stopRightSwipe
      }

      this._translateX.setValue(newDX)
    }
  }

  ensureScrollEnabled = () => {
    if (!this.parentScrollEnabled) {
      this.parentScrollEnabled = true
      this.props.setScrollEnabled && this.props.setScrollEnabled(true)
    }
  }

  handlePanResponderEnd (e: any, gestureState: any) {
    // decide how much the velocity will affect the final position that the list item settles in.
    const swipeToOpenVelocityContribution = this.props.swipeToOpenVelocityContribution || 0
    const possibleExtraPixels = this.props.rightOpenValue * swipeToOpenVelocityContribution
    const clampedVelocity = Math.min(gestureState.vx, MAX_VELOCITY_CONTRIBUTION)
    const projectedExtraPixels = possibleExtraPixels * (clampedVelocity / MAX_VELOCITY_CONTRIBUTION)

    // re-enable scrolling on listView parent
    this._ensureScrollEnabledTimer = setTimeout(this.ensureScrollEnabled, SCROLL_LOCK_MILLISECONDS)

    // finish up the animation
    let toValue = 0
    if (this._translateX._value >= 0) {
      // trying to swipe right
      if (this.swipeInitialX < this._translateX._value) {
        if (this._translateX._value - projectedExtraPixels > this.props.leftOpenValue * (this.props.swipeToOpenPercent / 100)) {
          // we're more than halfway
          toValue = this.props.leftOpenValue
        }
      } else {
        if (this._translateX._value - projectedExtraPixels > this.props.leftOpenValue * (1 - this.props.swipeToClosePercent / 100)) {
          toValue = this.props.leftOpenValue
        }
      }
    } else {
      // trying to swipe left
      if (this.swipeInitialX > this._translateX._value) {
        if (this._translateX._value - projectedExtraPixels < this.props.rightOpenValue * (this.props.swipeToOpenPercent / 100)) {
          // we're more than halfway
          toValue = this.props.rightOpenValue
        }
      } else {
        if (this._translateX._value - projectedExtraPixels < this.props.rightOpenValue * (1 - this.props.swipeToClosePercent / 100)) {
          toValue = this.props.rightOpenValue
        }
      }
    }

    this.manuallySwipeRow(toValue)
  }

  /*
   * This method is called by SwipeListView
   */
  closeRow () {
    this.manuallySwipeRow(0)
  }

  manuallySwipeRow (toValue: any) {
    Animated.spring(this._translateX, {
      toValue,
      friction: this.props.friction,
      tension: this.props.tension
    }).start(_ => {
      this.ensureScrollEnabled()
      if (toValue === 0) {
        this.isOpen = false
        this.props.onRowDidClose && this.props.onRowDidClose()
      } else {
        this.isOpen = true
        this.props.onRowDidOpen && this.props.onRowDidOpen(toValue)
      }
    })

    if (toValue === 0) {
      this.props.onRowClose && this.props.onRowClose()
    } else {
      this.props.onRowOpen && this.props.onRowOpen(toValue)
    }

    // reset everything
    this.swipeInitialX = null
    this.horizontalSwipeGestureBegan = false
  }

  renderVisibleContent () {
    // handle touchables
    const onPress = this.props.children[1].props.onPress

    if (onPress) {
      const newOnPress = _ => {
        this.onRowPress()
        onPress()
      }
      return React.cloneElement(this.props.children[1], {
        ...this.props.children[1].props,
        onPress: newOnPress
      })
    }

    return (
      <TouchableOpacity activeOpacity={1} onPress={_ => this.onRowPress()}>
        {this.props.children[1]}
      </TouchableOpacity>
    )
  }

  renderRowContent () {
    // We do this annoying if statement for performance.
    // We don't want the onLayout func to run after it runs once.
    if (this.state.dimensionsSet) {
      return (
        <Animated.View
          manipulationModes={['translateX']}
          {...this._panResponder.panHandlers}
          style={{
            zIndex: 2,
            transform: [{ translateX: this._translateX }]
          }}
        >
          {this.renderVisibleContent()}
        </Animated.View>
      )
    } else {
      return (
        <Animated.View
          manipulationModes={['translateX']}
          {...this._panResponder.panHandlers}
          onLayout={e => this.onContentLayout(e)}
          style={{
            zIndex: 2,
            transform: [{ translateX: this._translateX }]
          }}
        >
          {this.renderVisibleContent()}
        </Animated.View>
      )
    }
  }

  render () {
    return (
      <View style={this.props.style ? this.props.style : styles.container}>
        <View
          style={[
            styles.hidden,
            {
              height: this.state.hiddenHeight,
              width: this.state.hiddenWidth
            }
          ]}
        >
          {this.props.children[0]}
        </View>
        {this.renderRowContent()}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  hidden: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1
  }
})

export default SwipeRow
