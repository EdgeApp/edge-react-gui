// @flow

import React, { Component } from 'react'
import { Dropdown } from 'react-native-material-dropdown'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

type Props = {
  value: string,
  label: string,
  error: string,
  containerStyle: any,
  fontSize?: number,
  labelFontSize?: number,
  baseColor: string,
  textColor: string,
  data: any[],
  valueExtractor?: any,
  labelExtractor?: any,
  onChangeText(string, number, any): void
}

type State = {
  inputText: string,
  autoFocus: boolean
}

class Select extends Component<Props, State> {
  defaultFontSize = 16
  defaultLabelFontSize = 12

  static defaultProps = {
    onFocus: null
  }

  render () {
    const value = this.props.value ? this.props.value : ''
    const error = this.props.error ? this.props.error : ''
    const { containerStyle, fontSize, labelFontSize, baseColor, textColor, onChangeText, data, valueExtractor, labelExtractor } = this.props
    return (
      <Dropdown
        label={this.props.label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        containerStyle={containerStyle}
        fontSize={fontSize ? scale(fontSize) : scale(this.defaultFontSize)}
        labelFontSize={labelFontSize ? scale(labelFontSize) : scale(this.defaultLabelFontSize)}
        baseColor={baseColor}
        textColor={textColor}
        selectedItemColor={THEME.COLORS.BLACK}
        itemColor={THEME.COLORS.BLACK}
        data={data}
        valueExtractor={valueExtractor}
        labelExtractor={labelExtractor}
      />
    )
  }
}

export { Select }
