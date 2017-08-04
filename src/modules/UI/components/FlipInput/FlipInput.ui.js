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
      isToggled: false,
      animatedTextOpacity: new Animated.Value(1)
    }
  }
  onToggleFlipInput = () => this.setState({isToggled: !this.state.isToggled})

  renderTopRow = (primary, onChangeText) => {
    <Animated.View style={{ opacity: this.state.animatedTextOpacity }}>
      <Text>{primary.denomination.symbol}</Text>
      <TextInput style={styles.primaryTextInput}
        value={primary.denominationAmount}
        onChangeText={onChangeText}
        autoCorrect={false}
        keyboardType='numeric'
        returnKeyType='done' />
      <Text>{primary.currencyCode}</Text>
    </Animated.View>
  }

  renderBottomRow = (secondary) => {
    <Animated.View style={{ opacity: this.state.animatedTextOpacity, alignSelf: 'center' }}>
      <Text>{secondary.denomination.symbol}</Text>
      <T style={styles.fees}>
        {secondary.denominationAmount}
      </T>
      <Text>{secondary.currencyCode}</Text>
    </Animated.View>
  }

  renderRows = () => {
    this.state.isToggled
      ? [
        this.renderTopRow(this.props.primary, this.props.onSecondaryAmountChange),
        this.renderBottomRow(this.props.secondary)
      ]
      : [
        this.renderTopRow(this.props.secondary, this.props.onPrimaryAmountChange),
        this.renderBottomRow(this.props.primary)
      ]
  }

  render () {
    <View style={styles.view}>
      <FAIcon style={styles.icon} onPress={this.onToggleFlipInput} name='swap-vert' size={36} />
      {this.renderRows()}
    </View>
  }
}
