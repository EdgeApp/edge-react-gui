// @flow
import React, {Component, type Node} from 'react'
import RNDropdownAlert from 'react-native-dropdownalert'

type Props = {
  visible: boolean,
  children?: Node,
  onClose: () => void,
  onPress?: () => void
}

export default class DropdownAlert extends Component<Props> {
  dropdownAlert: {alert: Function}
  componentWillReceiveProps (nextProps: Props) {
    if (this.shouldDisplay(this.props, nextProps)) {
      if (this.dropdownAlert) this.dropdownAlert.alert()
    }
  }

  dropdownAlert: ?any

  render () {
    const {children, onClose, onPress} = this.props

    // $FlowFixMe
    return (
    <RNDropdownAlert ref={this.dropdownAlert}
      onPress={onPress}
      panResponderEnabled={false}
      updateStatusBar={false}
      endDelta={20}
      onClose={onClose}>
      {children}
    </RNDropdownAlert>)
  }

  shouldDisplay = (current: Props, next: Props) => (!current.visible && next.visible)
}
