import React, { Component } from 'react'
import { Text, TextInput, View, StyleSheet, AlertIOS, Slider } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import leftArrow from '../../../left-arrow.png'
import KeyboardButton from '../KeyboardButton/index.js'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    borderColor: 'red',
    borderWidth: 1
  },
  keyboard: {
    flex: 1,
    borderColor: 'red',
    borderWidth: 1
  },
  row: {
    flex: 1,
    flexDirection: 'row'
  },
  calculation: {
    flex: 1,
    color: 'black'
  }
})

class Keyboard extends Component {
  constructor (props) {
    super(props)

    this.state = {
      displayValue: '0'
    }
  }

  inputDigit = (value) => {
    const { displayValue } = this.state

    const newDisplayValue =
        displayValue === '0' ?
          value :
          this.state.displayValue + value

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
    const displayValue =
        this.state.displayValue.substring(0, this.state.displayValue.length - 1) || '0'

    this.setState({
      displayValue
    })
  }

  clearScreen = () => {
    this.setState({
      displayValue: '0'
    })
  }

  doOperation = () => {

  }

  actions = (action, payload) => {
    const operations = {
      '+': (previousValue) => { return previousValue },
      '-': () => { return previousValue },
      '*': () => { return previousValue },
      '/': () => { return previousValue },
      '%': () => { return previousValue }
    }

    return operations[action] || payload
  }

  render () {
    console.log('rendering keyboard')

    return (
      <View style={styles.view}>

        <TextInput
          style={styles.calculation}
          value={this.state.displayValue}
          editable={false}
          />

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
            <KeyboardButton
              style={styles.KeyboardButton}
              character={'<|'}
              onPress={this.doBackspace}
              onLongPress={this.clearScreen}
              />
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

export default connect()(Keyboard)
