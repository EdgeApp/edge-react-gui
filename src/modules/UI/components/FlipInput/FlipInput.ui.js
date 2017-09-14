import React, {Component} from 'react'
import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import {styles, top, bottom} from './styles.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import * as UTILS from '../../../utils.js'

export default class FlipInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isToggled: false,
      primaryDisplayAmount: props.primaryDisplayAmount || '',
      secondaryDisplayAmount: props.secondaryDisplayAmount || '',
      primaryShouldUpdate: true,
      secondaryShouldUpdate: true
    }
  }
  onToggleFlipInput = () => this.setState({
    isToggled: !this.state.isToggled,
    secondaryShouldUpdate: !this.state.secondaryShouldUpdate
  })

  componentWillReceiveProps (nextProps) {
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

  onPrimaryAmountChange = (primaryDisplayAmount) => {
    if (!this.props.isValidInput(primaryDisplayAmount)) { return }
    const formattedPrimaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(primaryDisplayAmount), 8)
    this.setState({
      primaryDisplayAmount: formattedPrimaryDisplayAmount,
      primaryShouldUpdate: false,
      secondaryShouldUpdate: true
    }, this.props.onPrimaryAmountChange(formattedPrimaryDisplayAmount))
  }

  onSecondaryAmountChange = (secondaryDisplayAmount) => {
    if (!this.props.isValidInput(secondaryDisplayAmount)) { return }
    const formattedSecondaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(secondaryDisplayAmount), 2)
    console.log('BEFORE: this.setState', this.state)
    this.setState({
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      primaryShouldUpdate: !this.state.primaryShouldUpdate,
      secondaryShouldUpdate: false
    }, () => this.props.onSecondaryAmountChange(formattedSecondaryDisplayAmount))
  }

  topDisplayAmount = () => this.state.isToggled ? this.state.secondaryDisplayAmount : this.state.primaryDisplayAmount
  bottomDisplayAmount = () => this.state.isToggled ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount

  topRow = (denominationInfo, onChangeText) => <View style={top.row} key={'top'}>
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

  bottomRow = (denominationInfo) => {
    const amount = this.bottomDisplayAmount()
    return <TouchableWithoutFeedback onPress={this.onToggleFlipInput} key={'bottom'}><View style={bottom.row}>
      <Text style={[bottom.symbol]}>
        {denominationInfo.displayDenomination.symbol}
      </Text>
      <Text style={[bottom.amount, !amount && {color: 'rgba(255, 255, 255, 0.60)'}]}>
        {amount || '0'}
      </Text>
      <Text style={[bottom.currencyCode]}>
        {denominationInfo.displayDenomination.name}
      </Text>
    </View></TouchableWithoutFeedback>
  }

  renderRows = (primaryInfo, secondaryInfo, isToggled) => (
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
    console.log('this.state', this.state)
    return (
      <View style={[styles.container]}>
        <View style={styles.flipButton}>
          <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name='swap-vert' size={36} />
        </View>
        {this.renderRows(primaryInfo, secondaryInfo, isToggled)}
        <View style={styles.spacer} />
      </View>
    )
  }
}
