// @flow

import React, {Component} from 'react'
import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform
} from 'react-native'
import {styles, top, bottom} from './styles.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import * as UTILS from '../../../utils.js'
import {bns} from 'biggystring'
import type {GuiCurrencyInfo} from '../../../../types'
import * as Constants from '../../../../constants/indexConstants'

export type FlipInputFieldInfo = GuiCurrencyInfo & {
  nativeAmount?: string,
  displayAmount?: string
}

type State = {
  isToggled: boolean,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string
}

type Props = {
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string,
  isValidInput: (string) => boolean,
  onPrimaryAmountChange: (string) => void,
  onSecondaryAmountChange: (string) => void
}

const getInitialState = (props: Props) => ({
  isToggled: false,
  primaryDisplayAmount: props.primaryDisplayAmount || '',
  secondaryDisplayAmount: props.secondaryDisplayAmount || ''
})

export default class FlipInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = getInitialState(props)
  }
  onToggleFlipInput = () => this.setState({
    isToggled: !this.state.isToggled
  })

  componentWillReceiveProps (nextProps: Props) {
    if (!bns.eq(nextProps.primaryDisplayAmount, this.state.primaryDisplayAmount)) {
      this.setState({
        primaryDisplayAmount: UTILS.truncateDecimals(nextProps.primaryDisplayAmount, 8)
      })
    }

    if (!bns.eq(nextProps.secondaryDisplayAmount, this.state.secondaryDisplayAmount)) {
      this.setState({
        secondaryDisplayAmount: UTILS.truncateDecimals(nextProps.secondaryDisplayAmount, 2)
      })
    }
  }

  onPrimaryAmountChange = (primaryDisplayAmount: string) => {
    if (!this.props.isValidInput(primaryDisplayAmount)) { return }
    const formattedPrimaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(primaryDisplayAmount), 8)
    this.setState({
      primaryDisplayAmount: formattedPrimaryDisplayAmount
    }, this.props.onPrimaryAmountChange(formattedPrimaryDisplayAmount))
  }

  onSecondaryAmountChange = (secondaryDisplayAmount: string) => {
    if (!this.props.isValidInput(secondaryDisplayAmount)) { return }
    const formattedSecondaryDisplayAmount = UTILS.truncateDecimals(UTILS.formatNumber(secondaryDisplayAmount), 2)
    // console.log('BEFORE: this.setState', this.state)
    this.setState({
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
    }, () => this.props.onSecondaryAmountChange(formattedSecondaryDisplayAmount))
  }

  topDisplayAmount = () => this.state.isToggled ? this.state.secondaryDisplayAmount : this.state.primaryDisplayAmount
  bottomDisplayAmount = () => this.state.isToggled ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount

  topRow = (denominationInfo: FlipInputFieldInfo, onChangeText: ((string) => void)) => <View style={top.row} key={'top'}>
      <Text style={[top.symbol]}>
        {denominationInfo.displayDenomination.symbol}
      </Text>
      <TextInput style={[top.amount, (Platform.OS === 'ios') ? {} : {paddingBottom: 2}]}
        placeholder={'0'}
        placeholderTextColor={'rgba(255, 255, 255, 0.60)'}
        value={this.topDisplayAmount()}
        onChangeText={onChangeText}
        autoCorrect={false}
        keyboardType='numeric'
        selectionColor='white'
        returnKeyType='done'
        underlineColorAndroid={'transparent'}
      />
      <Text style={[top.currencyCode]}>
        {denominationInfo.displayDenomination.name}
      </Text>
    </View>

  bottomRow = (denominationInfo: FlipInputFieldInfo) => {
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

  renderRows = (primaryInfo: FlipInputFieldInfo, secondaryInfo: FlipInputFieldInfo, isToggled: boolean) => (
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
