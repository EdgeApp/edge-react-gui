// @flow

import { Shape, Surface } from '@react-native-community/art'
import React, { Component } from 'react'
import { Animated } from 'react-native'

const CIRCLE = Math.PI * 2

type Props = {
  color: string,
  progress: number,
  size: number
}

export class ProgressPie extends Component<Props> {
  progressAnimation: Animated.Value
  progressTarget: number

  constructor (props: Props) {
    super(props)

    this.progressTarget = 0
    this.progressAnimation = new Animated.Value(this.progressTarget)
  }

  componentDidUpdate (prevProps: Props) {
    const { progress } = this.props

    if (progress !== this.progressTarget) {
      this.progressTarget = progress

      // Progress has changed, so update the animation:
      Animated.spring(this.progressAnimation, {
        toValue: this.progressTarget,
        bounciness: 0
      }).start()
    }
  }

  render () {
    const { color, size } = this.props

    return (
      <Surface width={size} height={size}>
        <AnimatedPieShape progress={this.progressAnimation} radius={size / 2} color={color} />
      </Surface>
    )
  }
}

/**
 * This is a separate component so we can animate its props.
 */
class PieShape extends Component<{ color: string, progress: number, radius: number }> {
  render () {
    const { color, progress, radius } = this.props

    const angle = progress * CIRCLE
    const endAngle = CIRCLE / 4 - angle
    const arcFlag = angle < Math.PI ? 1 : 0

    const path = `M${radius} ${radius}
      L${radius} 0
      A${radius} ${radius} 0 ${arcFlag} 0 ${radius * (1 + Math.cos(endAngle))} ${radius * (1 - Math.sin(endAngle))}
      L${radius} ${radius}`

    return <Shape d={path} fill={color} />
  }
}

const AnimatedPieShape = Animated.createAnimatedComponent(PieShape)
