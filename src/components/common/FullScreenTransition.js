// @flow

import * as React from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'

type FullScreenTransitionState = {
  opacity: number
}

type FullScreenTransitionProps = {
  image: React.Node,
  text: React.Node,
  onDone: Function
}

export class FullScreenTransitionComponent extends React.Component<FullScreenTransitionProps, FullScreenTransitionState> {
  constructor(props: FullScreenTransitionProps) {
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
          duration: 1500,
          toValue: 1,
          useNativeDriver: false
        }),
        Animated.timing(this.state.opacity, {
          duration: 1400,
          toValue: 1,
          useNativeDriver: false
        }),
        Animated.timing(this.state.opacity, {
          duration: 1500,
          toValue: 0,
          useNativeDriver: false
        })
      ]).start(() => {
        onDone()
      })
    }, 400)
  }

  render() {
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

const rawStyles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%',
    position: 'absolute'
  },
  view: {
    position: 'relative',
    top: THEME.HEADER,
    paddingHorizontal: 20,
    height: PLATFORM.usableHeight
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
