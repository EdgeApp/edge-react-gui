// @flow
import {Component} from 'react'
import {Alert} from 'react-native'

type Props = {
  view: boolean,
  message: string,
  route: any,
  closeAlert: Function
}

export default class TransactionAlert extends Component<Props> {
  componentWillReceiveProps (nextProps: Props) {
    // prevent duplicate alerts
    if (this.props.view === nextProps.view) return

    if (nextProps.view) {
      this.openAlert(nextProps)
    } else {
      this.props.closeAlert()
    }
  }

  openAlert = (props: Props) => {
    const defaultButtons = [{
      text: 'Later',
      onPress: this.props.closeAlert,
      style: 'cancel'
    }, {
      text: 'Check Now',
      onPress: this.props.closeAlert
    }]

    Alert.alert(
      'Transaction Received',
      props.message,
      props.buttons || defaultButtons,
      {onDismiss: this.props.closeAlert}
    )
  }

  render () {
    return null
  }
}
