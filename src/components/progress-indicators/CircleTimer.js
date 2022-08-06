// @flow

import * as React from 'react'
import { View } from 'react-native'

type Props = {
  expiration: Date,
  timeExpired(): void
}

export const TEN_MINUTES = 600

export class CircleTimer extends React.Component<Props> {
  componentDidMount() {
    setTimeout(this.timerTick, 1000)
  }

  timerTick = () => {
    const now = new Date()
    const nowMilli = now.getTime()
    const expMil = this.props.expiration.getTime()
    if (this.props.expiration && nowMilli >= expMil) {
      this.props.timeExpired()
      return
    }
    /* To be used when we have an actual UI
    const delta = TEN_MINUTES - (this.props.expiration - nowMilli) / 1000
    const percentage = (delta / TEN_MINUTES) * 100
    console.log('timer: delta', delta)
    console.log('timer: percentage ', percentage) */
    setTimeout(this.timerTick, 1000)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.expiration !== null && nextProps.expiration !== this.props.expiration) {
      setTimeout(this.timerTick, 1000)
    }
  }

  render() {
    if (!this.props.expiration) {
      return null
    }
    return <View style={{ width: 1, height: 1 }} />
  }
}
