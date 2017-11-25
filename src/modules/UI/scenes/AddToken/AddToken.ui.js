import React, {Component} from 'react'
import {
  View
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import styles from './style.js'
import {PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import * as UTILS from '../../../utils.js'


class AddToken extends Component {
  constructor (props) {
    super(props)
    this.state = {
      nameInput: '',
      currencyCodeInput: '',
      denominationInput: 1
    }
  }

  render () {
    return (
      <View style={[styles.addTokens]}>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.addtoken_top_instructions}</Text>
          </View>
          <View style={styles.formArea}>
            <View style={[styles.nameArea ,UTILS.border()]}>
              <FormField
                style={[styles.nameInput]}
                value={this.state.nameInput}
                onChangeText={this.onChangeName}
                autoCapitalize={'words'}
                autoFocus
                label={s.strings.addtoken_name_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.currencyCodeArea ,UTILS.border()]}>
              <FormField
                style={[styles.currencyCodeInput]}
                value={this.state.currencyCodeInput}
                onChangeText={this.onChangeCurrencyCode}
                autoCapitalize={'characters'}
                label={s.strings.addtoken_currency_code_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.denominationArea ,UTILS.border()]}>
              <FormField
                style={[styles.denominationInput]}
                onChangeText={this.onChangeDenomination}
                autoCapitalize={'none'}
                label={s.strings.addtoken_denomination_input_text}
                returnKeyType={'done'}
                keyboardType={'numeric'}
              />
            </View>
          </View>
          <View style={[styles.buttonsArea, UTILS.border()]}>
            <PrimaryButton
              text={'Save'}
              style={styles.saveButton}
              onPressFxn={this._onSave}
            />
          </View>
        </View>
      </View>
    )
  }

  onChangeName = (input) => {
    this.setState({
      nameInput: input
    })
  }

  onChangeCurrencyCode = (input) => {
    this.setState({
      currencyCodeInput: input.toUpperCase()
    })
  }

  onChangeDenomination = (input) => {
    this.setState({
      denominationInput: input
    })
  }

  onSave = () => {
  
  }
}

const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
