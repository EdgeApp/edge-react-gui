// @flow

import { Component } from 'react'
import { Alert } from 'react-native'

type Props = {
  view: boolean,
  title: string,
  message: string,
  buttons: Array<{ title: string, message: string }>,
  closeAlert: Function
}

export default class ABAlert extends Component<Props> {
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    // prevent duplicate alerts
    if (this.props.view === nextProps.view) return

    if (nextProps.view) {
      this.openAlert(nextProps)
    } else {
      this.props.closeAlert()
    }
  }

  openAlert = (props: Props) => {
    const defaultButtons = [
      {
        text: 'OK',
        onPress: this.props.closeAlert,
        style: 'cancel'
      }
    ]

    Alert.alert(props.title, props.message, props.buttons || defaultButtons, { onDismiss: this.props.closeAlert })
  }

  render () {
    return null
  }
}
