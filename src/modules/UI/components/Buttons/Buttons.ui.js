import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Text, View, TouchableHighlight} from 'react-native'
import T from '../FormattedText'
import styles, {styles as styleRaw} from './style'
import strings from '../../../../locales/default'

class PrimaryButton extends Component {
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
  }

  render () {
    return (
      <TouchableHighlight {...this.props}
        onPress={this.props.onPressFunction}
        underlayColor={styleRaw.primaryUnderlay.color}
        style={[
          styles.primaryButtonWrap,
          styles.stylizedButton,
          this.props.style]}
      >
        <View style={styles.stylizedButtonTextWrap}>
          {this.props.processingFlag
            ? (this.props.processingElement)
            :    (<T style={[styles.primaryButton, styles.stylizedButtonText]}>
              {this.props.text}
            </T>)
          }
        </View>
      </TouchableHighlight>
    )
  }
}
PrimaryButton.propTypes = {
  text: PropTypes.string,
  onPressFunction: PropTypes.func
}

const CANCEL_TEXT = strings.enUS['string_cancel']

class SecondaryButton extends Component {
  render () {
    return (
      <TouchableHighlight style={[
        styles.secondaryButtonWrap,
        styles.stylizedButton,
        this.props.style
      ]}
        onPress={this.props.onPressFunction}
        disabled={this.props.disabled}
        underlayColor={styleRaw.secondaryUnderlay.color}>
        <View style={styles.stylizedButtonTextWrap}>
          <T style={[styles.secondaryButton, styles.stylizedButtonText]}>
            {this.props.text || CANCEL_TEXT}
          </T>
        </View>
      </TouchableHighlight>
    )
  }
}
SecondaryButton.propTypes = {
  text: PropTypes.string,
  onPressFunction: PropTypes.func
}

class TertiaryButton extends Component {
  onPress = this.props.onPressFunction

  render () {
    return (
      <TouchableHighlight style={[
        styles.stylizedButton,
        styles.tertiaryButtonWrap
      ]}
        onPress={this.onPress}
        underlayColor={styleRaw.tertiaryUnderlay.color}>
        <Text style={styles.tertiaryButton} {...this.props}>
          {this.props.text}
        </Text>
      </TouchableHighlight>
    )
  }
}
TertiaryButton.propTypes = {
  text: PropTypes.string,
  onPressFunction: PropTypes.func
}

export {PrimaryButton, SecondaryButton, TertiaryButton}
