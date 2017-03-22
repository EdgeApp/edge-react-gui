import React, { Component } from 'react'
import { Input, InputGroup } from 'native-base'
// import style from '../Style'

class TemplateTextInput extends Component {
  blur () {
    this.refs.input._textInput.blur()
  }
  focus () {
    this.refs.input._textInput.focus()
  }
  renderContainer () {
    return (
      <InputGroup ref='inputGroup' borderType={this.props.borderType} style={this.props.inputGroupStyle} >
        <Input ref='input'
          autoCapitalize='none'
          {...this.props}
      />
      </InputGroup>
    )
  }
  render () {
    return this.renderContainer()
  }
}

export default TemplateTextInput
