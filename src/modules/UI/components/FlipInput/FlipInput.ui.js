//@flow
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import {styles, top, bottom} from './styles.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import * as UTILS from '../../../utils.js'
import * as Constants from '../../../../constants/indexConstants'
import type {GuiCurrencyInfo} from '../../../../types'

type Props = {
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  isValidInput: Function,
  onPrimaryAmountChange: Function,
  onSecondaryAmountChange: Function
}
type State = {
  isToggled: boolean,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string,
  primaryShouldUpdate: boolean,
  secondaryShouldUpdate: boolean
}
const getInitialState = (props: Props) => ({
  isToggled: false,
  primaryDisplayAmount: props.primaryDisplayAmount || '',
  secondaryDisplayAmount: props.secondaryDisplayAmount || '',
  primaryShouldUpdate: true,
  secondaryShouldUpdate: true
})

export default class FlipInput extends Component<Props,State> {
  static propTypes = {
    primaryDisplayAmount: PropTypes.string,
    secondaryDisplayAmount: PropTypes.string,
    primaryInfo: PropTypes.instanceOf.GuiCurrencyInfo,
    secondaryInfo: PropTypes.instanceOf.GuiCurrencyInfo,
    isValidInput: PropTypes.func.isRequired,
    onPrimaryAmountChange: PropTypes.func.isRequired,
    onSecondaryAmountChange: PropTypes.func.isRequired
  }
  static defaultProps = {
    primaryDisplayAmount: '',
    secondaryDisplayAmount: ''
  }
  constructor (props: Props) {
    super(props)
    this.state = getInitialState(props)
  }
  onToggleFlipInput = () => this.setState({
    isToggled: !this.state.isToggled,
    secondaryShouldUpdate: !this.state.secondaryShouldUpdate
  })

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.primaryDisplayAmount !== this.state.primaryDisplayAmount || nextProps.secondaryDisplayAmount !== this.state.secondaryDisplayAmount) {
      return this.setState(getInitialState(nextProps))
    }

    if (this.state.primaryShouldUpdate) {
      this.setState({
        primaryDisplayAmount: UTILS.truncateDecimals(nextProps.primaryDisplayAmount, 8),
        primaryShouldUpdate: false
      })
    }

    if (this.state.secondaryShouldUpdate) {
      this.setState({
        primaryShouldUpdate: false,
        secondaryDisplayAmount: UTILS.truncateDecimals(nextProps.secondaryDisplayAmount, 2)
      })
    }
  }

  onPrimaryAmountChange = (primaryDisplayAmount: string) => {
    if (!this.props.isValidInput(primaryDisplayAmount)) { return }
    const formattedPrimaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(primaryDisplayAmount), 8)
    this.setState({
      primaryDisplayAmount: formattedPrimaryDisplayAmount,
      primaryShouldUpdate: false,
      secondaryShouldUpdate: true
    }, this.props.onPrimaryAmountChange(formattedPrimaryDisplayAmount))
  }

  onSecondaryAmountChange = (secondaryDisplayAmount: string) => {
    if (!this.props.isValidInput(secondaryDisplayAmount)) { return }
    const formattedSecondaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(secondaryDisplayAmount), 2)
    // console.log('BEFORE: this.setState', this.state)
    this.setState({
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      primaryShouldUpdate: !this.state.primaryShouldUpdate,
      secondaryShouldUpdate: false
    }, () => this.props.onSecondaryAmountChange(formattedSecondaryDisplayAmount))
  }

  topDisplayAmount = () => this.state.isToggled ? this.state.secondaryDisplayAmount : this.state.primaryDisplayAmount
  bottomDisplayAmount = () => this.state.isToggled ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount

  topRow = (denominationInfo: GuiCurrencyInfo, onChangeText: Function) => <View style={top.row} key={'top'}>
      <Text style={top.symbol}>
        {denominationInfo.displayDenomination.symbol}
      </Text>
      <TextInput style={[top.amount]}
        placeholder={'0'}
        placeholderTextColor={'rgba(255, 255, 255, 0.60)'}
        value={this.topDisplayAmount()}
        onChangeText={onChangeText}
        autoCorrect={false}
        keyboardType='numeric'
        selectionColor='white'
        returnKeyType='done' />
      <Text style={[top.currencyCode]}>
        {denominationInfo.displayDenomination.name}
      </Text>
    </View>

  bottomRow = (denominationInfo: GuiCurrencyInfo) => {
    const amount = this.bottomDisplayAmount()
    return <TouchableWithoutFeedback onPress={this.onToggleFlipInput} key={'bottom'}><View style={bottom.row}>
      <Text style={[bottom.symbol]}>
        {denominationInfo.displayDenomination.symbol}
      </Text>
      <Text style={[
        bottom.amount,
        !amount && bottom.alert
      ]}>
        {amount || '0'}
      </Text>
      <Text style={[bottom.currencyCode]}>
        {denominationInfo.displayDenomination.name}
      </Text>
    </View></TouchableWithoutFeedback>
  }

  renderRows = (primaryInfo: GuiCurrencyInfo, secondaryInfo: GuiCurrencyInfo, isToggled: boolean) => (
      <View style={[styles.rows]}>
        {isToggled
          ? [
            this.topRow(secondaryInfo, this.onSecondaryAmountChange),
            this.bottomRow(primaryInfo)
          ]
          : [
            this.topRow(primaryInfo, this.onPrimaryAmountChange),
            this.bottomRow(secondaryInfo)
          ]}
      </View>
    )

  render () {
    const {primaryInfo, secondaryInfo} = this.props
    const {isToggled} = this.state
    // console.log('this.state', this.state)
    return (
      <View style={[styles.container]}>
        <View style={styles.flipButton}>
          <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name={Constants.SWAP_VERT} size={36} />
        </View>
        {this.renderRows(primaryInfo, secondaryInfo, isToggled)}
        <View style={styles.spacer} />
      </View>
    )
  }
}
