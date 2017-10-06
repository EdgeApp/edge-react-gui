// @flow
import React, {Component} from 'react'
import RNDropdownAlert from 'react-native-dropdownalert'

import SLIcon from 'react-native-vector-icons/SimpleLineIcons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'

import styles from './styles'

type Props = {
  dismissDropdownAlert: () => void,
  visible: boolean,
  type: 'info' | 'warn' | 'error' | 'success',
  title: string,
  message: string,
  left?: any,
  right?: any
}

export default class DropdownAlert extends Component<Props> {
  dropdown: {alertWithType: Function}

  componentWillReceiveProps (nextProps: Props) {
    if (this.shouldDisplay(this.props, nextProps)) {
      this.dropdown.alertWithType(nextProps.type, nextProps.title, nextProps.message)
    }
  }

  alertIcon = () => <MCIcon name={'alert-outline'} color={'red'} style={{paddingHorizontal: 10}} />
  infoIcon = () => <SLIcon name={'question'} color={'blue'} style={{paddingHorizontal: 10}} />

  render () {
    { /* $FlowExpectedError */ }
    return <RNDropdownAlert ref={(ref) => this.dropdown = ref}
      panResponderEnabled={false}
      updateStatusBar={false}
      startDelta={-30}
      endDelta={30}
      containerStyle={styles.containerStyle}
      titleStyle={styles.titleStyle}
      defaultContainer={styles.defaultContainer}
      defaultTextContainer={styles.defaultTextContainer}
      onClose={this.props.dismissDropdownAlert}
      closeInterval={4000}
      left={this.props.left || this.alertIcon()}
      right={this.props.right || this.infoIcon()} />
  }

  shouldDisplay = (current: Props, next: Props) => (!current.visible && next.visible)
}
