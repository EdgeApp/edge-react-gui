import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Text, View, TouchableHighlight} from 'react-native'
import T from '../FormattedText'
import s from './style'
import {colors as c} from '../../../../theme/variables/airbitz'

class PrimaryButton extends Component {
  render () {
    console.log('rendering PrimaryButton, this is: ', this)
    return (
      <TouchableHighlight onPress={this.props.onPressFunction} underlayColor={c.primary} style={[s.primaryButtonWrap, s.stylizedButton, this.props.style]}>
        <View style={s.stylizedButtonTextWrap}>
          {this.props.processingFlag ?
            (this.props.processingElement)
            :
            (<T style={[s.primaryButton, s.stylizedButtonText]}>
              {this.props.text}
            </T>
            )
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

class SecondaryButton extends Component {
  render () {
    console.log('rendering SecondaryButton, this is: ', this)
    return (
      <TouchableHighlight disabled={this.props.disabled} onPress={this.props.onPressFunction} underlayColor={c.gray1} style={[s.secondaryButtonWrap, s.stylizedButton, this.props.style]}>
        <View style={s.stylizedButtonTextWrap}>
          <T style={[s.secondaryButton, s.stylizedButtonText]}>
            {this.props.text || 'Cancel'}
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
  constructor (props) {
    super(props)
    this.state = {
      bgColor: 'white'
    }
  }

  _onPress = () => {
    this.props.onPressFunction()
  }

  render () {
    console.log('tertiaryButon props are: ', this.props)
    return (
      <TouchableHighlight onPress={this._onPress} underlayColor={c.secondary} style={[ s.stylizedButton, s.tertiaryButtonWrap, {backgroundColor: 'white'} ]}>
        <Text style={s.tertiaryButton} {...this.props}>
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
