import React, { Component } from 'react'
import { TextInput, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { Form, Label, Input, Item } from 'native-base'

class FlipInput extends Component {
  constructor (props) {
    super(props)
    this.updateInputField = props.updateInputField
  }

  _handleUpdateInputField = (value) => {
    (value) => this.setState({value})
    this.updateInputField(value)
  }

  render () {
    return (
      <View>
        <Form>
          <TextInput
            style={styles.container}
            placeholder='Enter Amount'
            keyboardType='numeric'
            onChangeText={this._handleUpdateInputField}
            />
        </Form>
      </View>
    )
  }
}

export default connect()(FlipInput)
