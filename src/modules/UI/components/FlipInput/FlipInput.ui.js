import React, { Component } from 'react'
import {
  Animated,
  Text,
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

  renderPrimaryRow = (primary) => {
    <Animated.View style={{ opacity: this.state.flipInputOpacity }}>
      <Text>{primary.denomination.symbol}</Text>
      <TextInput style={styles.primaryTextInput}
        value={primary.amount}
        autoCorrect={false}
        keyboardType='numeric'
        returnKeyType='done' />
      <Text>{primary.currencyCode}</Text>
    </Animated.View>
  }

  renderSecondaryRow = (secondary) => {
    <Animated.View style={{ opacity: this.state.flipInputOpacity, alignSelf: 'center' }}>
      <Text>{secondary.denomination.symbol}</Text>
      <T style={styles.fees}>
        {secondary.amount}
      </T>
      <Text>{secondary.currencyCode}</Text>
    </Animated.View>
  }

  render () {
    <View style={styles.view}>
      <FAIcon style={styles.icon} onPress={() => console.log('onToggleFlipInput')} name='swap-vert' size={36} />
      {this.renderPrimaryRow(this.props.primary)}
      {this.renderSecondaryRow(this.props.secondary)}
    </View>
  }
}
