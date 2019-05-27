// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import RNDropdownAlert from 'react-native-dropdownalert'

import { isIphoneX } from '../.././../../lib/isIphoneX.js'

type Props = {
  visible: boolean,
  children?: Node,
  onClose: () => void,
  onPress?: () => void
}

export default class DropdownAlert extends Component<Props> {
  dropdownAlert: ?{ alert: Function }
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (this.shouldDisplay(this.props, nextProps)) {
      if (this.dropdownAlert) this.dropdownAlert.alert()
    }
  }

  render () {
    const { children, onClose, onPress } = this.props

    return (
      <RNDropdownAlert
        ref={ref => {
          this.dropdownAlert = ref
        }}
        onPress={onPress}
        panResponderEnabled={false}
        updateStatusBar={false}
        endDelta={isIphoneX ? 85 : 60}
        onClose={onClose}
      >
        {children}
      </RNDropdownAlert>
    )
  }

  shouldDisplay = (current: Props, next: Props) => !current.visible && next.visible
}
