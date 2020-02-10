// @flow

import React, { Component } from 'react'

import { Select } from '../materialWrappers/indexMaterial'

type FormFieldSelectProps = {
  value: string,
  label: string,
  error?: string,
  style: Object,
  fontSize?: number,
  data: any[],
  labelFontSize?: number,
  valueExtractor?: any,
  labelExtractor?: any,
  onChangeText(string, number, any): void
}

class FormFieldSelect extends Component<FormFieldSelectProps> {
  static defaultProps = {
    label: ''
  }

  render () {
    const { container, baseColor, textColor } = this.props.style
    const { data } = this.props
    return (
      <Select
        label={this.props.label}
        onChangeText={this.props.onChangeText}
        error={this.props.error || ''}
        containerStyle={container}
        fontSize={this.props.fontSize}
        labelFontSize={this.props.labelFontSize}
        baseColor={baseColor}
        textColor={textColor}
        value={this.props.value}
        data={data}
        labelExtractor={this.props.labelExtractor}
        valueExtractor={this.props.valueExtractor}
      />
    )
  }
}

export { FormFieldSelect }
