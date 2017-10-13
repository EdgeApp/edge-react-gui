// @flow
import React, {Component, type Node} from 'react'
import RNDropdownAlert from 'react-native-dropdownalert'

type Props = {
  visible: boolean,
  onClose: () => void,
  children?: Node,
}

export default class DropdownAlert extends Component<Props> {
  dropdownAlert: {alert: Function}
  componentWillReceiveProps (nextProps: Props) {
    if (this.shouldDisplay(this.props, nextProps)) {
      this.dropdownAlert.alert()
    }
  }

  render () {
    const {children, onClose} = this.props

    // $FlowFixMe
    return <RNDropdownAlert ref={(ref) => this.dropdownAlert = ref}
      panResponderEnabled={false}
      updateStatusBar={false}
      startDelta={-10}
      endDelta={44}
      onClose={onClose}>
      {children}
    </RNDropdownAlert>
  }

  shouldDisplay = (current: Props, next: Props) => (!current.visible && next.visible)
}
