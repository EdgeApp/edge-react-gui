// @flow
import React, {Component} from 'react'
import LocalNotification from 'react-native-local-notification'

type Props = {
  displayAlert: boolean,
  dismissAlert: Function,
  message: string
}

const DURATION = 4000 // ms

export default class ErrorAlert extends Component<Props> {
  localNotification: any

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.displayAlert && !this.props.displayAlert) {
      this.localNotification.showNotification({
        title: 'Error',
        text: nextProps.message,
        onHide: nextProps.dismissAlert,
      })

      setTimeout(nextProps.dismissAlert, DURATION) // android do not call onHide
    }
  }

  handleRef = (localNotification: any) => {
    this.localNotification = localNotification
  }

  render () {
    return <LocalNotification ref={this.handleRef} duration={DURATION} />
  }
}
