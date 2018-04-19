/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TextInput, View } from 'react-native'

import KeyboardButton from '../KeyboardButton/index.js'
import styles from './styles'

export default class Keyboard extends Component {
  constructor (props) {
    super(props)

    this.state = {
      displayValue: '0'
    }
  }

  inputDigit = value => {
    const { displayValue } = this.state

    const newDisplayValue = displayValue === '0' ? value : this.state.displayValue + value

    this.setState({
      displayValue: newDisplayValue
    })
  }

  inputDot = () => {
    const { displayValue } = this.state

    if (displayValue.indexOf('.') === -1) {
      this.setState({
        displayValue: displayValue + '.'
      })
    }
  }

  doBackspace = () => {
    const displayValue = this.state.displayValue.substring(0, this.state.displayValue.length - 1) || '0'

    this.setState({
      displayValue
    })
  }

  clearScreen = () => {
    this.setState({
      displayValue: '0'
    })
  }

  doOperation = () => {}

  actions = (action, payload) => {
    const operations = {
      '+': previousValue => previousValue,
      '-': previousValue => previousValue,
      '*': previousValue => previousValue,
      '/': previousValue => previousValue,
      '%': previousValue => previousValue
    }

    return operations[action] || payload
  }

  render () {
    // console.log('rendering keyboard')

    return (
      <View style={styles.view}>
        <TextInput style={styles.calculation} value={this.state.displayValue} editable={false} />

        <View style={styles.keyboard}>
          <View style={styles.row}>
            <KeyboardButton style={styles.KeyboardButton} character={'7'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'8'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'9'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'('} onPress={this.onPress} />
            <KeyboardButton style={styles.KeyboardButton} character={')'} onPress={this.onPress} />
          </View>

          <View style={styles.row}>
            <KeyboardButton style={styles.KeyboardButton} character={'4'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'5'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'6'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'*'} onPress={this.onPress} />
            <KeyboardButton style={styles.KeyboardButton} character={'/'} onPress={this.onPress} />
          </View>

          <View style={styles.row}>
            <KeyboardButton style={styles.KeyboardButton} character={'1'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'2'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'3'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'+'} onPress={this.onPress} />
            <KeyboardButton style={styles.KeyboardButton} character={'-'} onPress={this.onPress} />
          </View>

          <View style={styles.row}>
            <KeyboardButton style={styles.KeyboardButton} character={'<|'} onPress={this.doBackspace} onLongPress={this.clearScreen} />
            <KeyboardButton style={styles.KeyboardButton} character={'0'} onPress={this.inputDigit} />
            <KeyboardButton style={styles.KeyboardButton} character={'.'} onPress={this.inputDot} />
            <KeyboardButton style={styles.KeyboardButton} character={'%'} onPress={this.onPress} />
            <KeyboardButton style={styles.KeyboardButton} character={'Done'} onPress={this.onPress} />
          </View>
        </View>
      </View>
    )
  }
}
