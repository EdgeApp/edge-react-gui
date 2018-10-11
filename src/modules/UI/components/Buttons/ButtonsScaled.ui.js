/* eslint-disable flowtype/require-valid-file-annotation */

import React, { PureComponent } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import s from '../../../../locales/strings.js'
import T from '../FormattedTextScaled'
import styles, { styles as styleRaw } from './style'

class PrimaryButton extends PureComponent {
  constructor (props) {
    super(props)
    this.style = [styles.primaryButtonWrap, styles.stylizedButton]

    if (props.style) {
      if (Array.isArray(props.style)) {
        this.style = this.style.concat(props.style)
      } else {
        this.style.push(props.style)
      }
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }
  onPress = () => {
    if (!this.props.processingFlag) {
      this.props.onPressFunction()
    }
  }

  render () {
    return (
      <TouchableHighlight
        {...this.props}
        onPress={this.onPress}
        underlayColor={styleRaw.primaryUnderlay.color}
        style={[styles.primaryButtonWrap, styles.stylizedButton, this.props.style]}
      >
        <View>
          {this.props.processingFlag ? this.props.processingElement : <T style={[styles.primaryButtonText, styles.stylizedButtonText]}>{this.props.text}</T>}
        </View>
      </TouchableHighlight>
    )
  }
}

const CANCEL_TEXT = s.strings.string_cancel

class SecondaryButton extends PureComponent {
  render () {
    return (
      <TouchableHighlight
        style={[styles.secondaryButtonWrap, styles.stylizedButton, this.props.style]}
        onPress={this.props.onPressFunction}
        disabled={this.props.disabled}
        underlayColor={styleRaw.secondaryUnderlay.color}
      >
        <View>
          <T style={[styles.secondaryButtonText, styles.stylizedButtonText]}>{this.props.text || CANCEL_TEXT}</T>
        </View>
      </TouchableHighlight>
    )
  }
}

class TertiaryButton extends PureComponent {
  render () {
    return (
      <TouchableHighlight
        style={[styles.tertiaryButtonWrap, styles.stylizedButton, this.props.buttonStyle]}
        onPress={this.props.onPressFunction}
        disabled={this.props.disabled}
        underlayColor={styleRaw.tertiaryUnderlay.color}
      >
        <View style={styles.tertiaryButtonTextWrap}>
          <T style={[styles.tertiaryButtonText, this.props.textStyle]} {...this.props}>
            {this.props.text}
          </T>
        </View>
      </TouchableHighlight>
    )
  }
}

export { PrimaryButton, SecondaryButton, TertiaryButton }
