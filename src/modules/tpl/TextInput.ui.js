import React, { Component } from 'react'
import { Input, InputGroup } from 'native-base'
import style from '../Style'

class TemplateTextInput extends Component {

  renderContainer () {
  	return (
    <InputGroup borderType={this.props.borderType} style={this.props.inputGroupStyle} >
      <Input {...this.props} />
    </InputGroup>
  	)
  }
  render () {
  	return this.renderContainer()
  }
}

export default TemplateTextInput
