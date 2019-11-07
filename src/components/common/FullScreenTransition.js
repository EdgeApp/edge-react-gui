// @flow

import type { Node } from 'react'
import React, { Component } from 'react'
import { Animated, View } from 'react-native'

import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import styles from '../../styles/scenes/CreateWalletStyle.js'

type FullScreenTransitionState = {
  opacity: number
}

type FullScreenTransitionProps = {
  image: Node,
  text: Node,
  onDone: Function
}

export class FullScreenTransitionComponent extends Component<FullScreenTransitionProps, FullScreenTransitionState> {
  constructor (props: FullScreenTransitionProps) {
    super(props)
    this.state = {
      opacity: new Animated.Value(0)
    }
  }

  componentDidMount = () => {
    const { onDone } = this.props
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: 1500
        }),
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: 1400
        }),
        Animated.timing(this.state.opacity, {
          toValue: 0,
          duration: 1500
        })
      ]).start(() => {
        onDone()
      })
    }, 400)
  }

  render () {
    const { opacity } = this.state
    const { image, text } = this.props
    return (
      <View style={styles.scene}>
        <Gradient style={styles.gradient} />
        <Animated.View
          style={[
            styles.view,
            {
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: opacity
            }
          ]}
        >
          {image}
          {text}
        </Animated.View>
      </View>
    )
  }
}
