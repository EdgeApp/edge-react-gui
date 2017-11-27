import React, {Component} from 'react'
import {
  View,
  ActivityIndicator
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
import * as ADD_TOKEN_ACTIONS from './action.js'


class AddToken extends Component {
  constructor (props) {
    super(props)
    this.state = {
      nameInput: 'CapCoin',
      currencyCodeInput: 'CAP1',
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
            <View style={[styles.nameArea, UTILS.border()]}>
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
                value={this.state.denominationInput}
              />
            </View>
          </View>
          <View style={[styles.buttonsArea, UTILS.border()]}>
            <PrimaryButton
              text={'Save'}
              style={styles.saveButton}
              onPressFunction={this._onSave}
              processingElement={<ActivityIndicator />}
              processingFlag={this.props.addTokenPending}
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
      currencyCodeInput: input.substring(0,5)
    })
  }

  onChangeDenomination = (input) => {
    this.setState({
      denominationInput: input.toString()
    })
  }

  _onSave = () => {
    const { nameInput, currencyCodeInput, denominationInput } = this.state
    const {walletId} = this.props
    this.props.addToken(walletId, nameInput, currencyCodeInput, denominationInput)
  }
}

const mapStateToProps = (state) => ({
  // context: CORE_SELECTORS.getContext(state),
  // account: CORE_SELECTORS.getAccount(state)
  addTokenPending: state.ui.wallets.addTokenPending
})
const mapDispatchToProps = (dispatch) => ({
  dispatch,
  addToken: (walletId: string, name: string, currencyCode: string, multiplier: string) => dispatch(ADD_TOKEN_ACTIONS.addToken(walletId, name, currencyCode, multiplier))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
