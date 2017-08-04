import React, { Component } from 'react'
import {
  Animated,
  TextInput,
  View
} from 'react-native'
import styles from './styles.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import T from '../FormattedText'

export default class FlipInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      flipInputOpacity: new Animated.Value(1)
    }
  }

  render () {
    <View style={styles.view}>
      <Animated.View style={[styles.row]}>
        <FAIcon style={styles.icon} onPress={() => console.log('onToggleFlipInput')} name='swap-vert' size={36} />

        <View style={[{ flex: 1 }]}>
          <View style={[styles.mainInputRow]}>
            <View style={[styles.primaryInputContainer]} name='InputAndFeesElement'>
              <Animated.View style={{ opacity: this.state.flipInputOpacity }}>
                <TextInput style={[ styles.primaryInput ]}
                  ref={'primaryInput'}
                  autoCorrect={false}
                  keyboardType='numeric'
                  returnKeyType='done' />
              </Animated.View>
            </View>
            <Animated.View style={[{ opacity: this.state.flipInputOpacity, alignSelf: 'center' }]}>
              <T style={styles.fees}>
                {primary.currencyConverter}
              </T>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  }
}
