import * as React from 'react'
import { View } from 'react-native'

interface Props {
  expiration: Date
  timeExpired: () => void
}

export const TEN_MINUTES = 600

export class CircleTimer extends React.Component<Props> {
  // @ts-expect-error
  componentMounted: boolean
  // @ts-expect-error
  timeoutId: ReturnType<typeof setTimeout>
  componentDidMount() {
    this.componentMounted = true
    this.timeoutId = setTimeout(this.timerTick, 1000)
  }

  componentWillUnmount() {
    this.componentMounted = false
    if (this.timeoutId != null) clearTimeout(this.timeoutId)
  }

  timerTick = () => {
    if (!this.componentMounted) return
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
    this.timeoutId = setTimeout(this.timerTick, 1000)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.expiration !== null && nextProps.expiration !== this.props.expiration) {
      if (this.timeoutId != null) clearTimeout(this.timeoutId)
      this.timeoutId = setTimeout(this.timerTick, 1000)
    }
  }

  render() {
    if (!this.props.expiration) {
      return null
    }
    return <View style={{ width: 1, height: 1 }} />
  }
}
