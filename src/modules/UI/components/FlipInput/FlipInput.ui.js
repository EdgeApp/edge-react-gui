// @flow

import React, {Component} from 'react'
import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform,
  Animated
} from 'react-native'
import {styles, top, bottom} from './styles.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import * as UTILS from '../../../utils.js'
import {bns} from 'biggystring'
import type {GuiCurrencyInfo} from '../../../../types'
import * as Constants from '../../../../constants/indexConstants'
import {intl} from '../../../../locales/intl'

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
  animatedValue: Animated.Value
  frontInterpolate: Animated.Value
  backInterpolate: Animated.Value

  constructor (props: Props) {
    super(props)
    this.state = getInitialState(props)
  }
  onToggleFlipInput = () => {
    this.setState({
      isToggled: !this.state.isToggled
    })
    if (this.state.isToggled) {
      Animated.spring(this.animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10
      }).start()
    }
    if (!this.state.isToggled) {
      Animated.spring(this.animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10
      }).start()
    }
  }
  componentWillMount () {
    this.animatedValue = new Animated.Value(0)
    this.frontInterpolate = this.animatedValue.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg']
    })

    this.backInterpolate = this.animatedValue.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg']
    })
  }

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
    if (!intl.isValidInput(primaryDisplayAmount)) {
      return
    }
    const formattedPrimaryDisplayAmount = intl.formatToNativeNumber(intl.truncateDecimals(intl.prettifyNumber(primaryDisplayAmount), 8))
    this.setState({
      primaryDisplayAmount: formattedPrimaryDisplayAmount
    }, this.props.onPrimaryAmountChange(formattedPrimaryDisplayAmount))
  }

  onSecondaryAmountChange = (secondaryDisplayAmount: string) => {
    if (!intl.isValidInput(secondaryDisplayAmount)) {
      return
    }
    const formattedSecondaryDisplayAmount = intl.formatToNativeNumber(intl.truncateDecimals(intl.prettifyNumber(secondaryDisplayAmount), 2))
    this.setState({
      secondaryDisplayAmount: formattedSecondaryDisplayAmount
    }, () => this.props.onSecondaryAmountChange(formattedSecondaryDisplayAmount))
  }

  topDisplayAmount = () => this.state.isToggled
    ? intl.formatNumberInput(this.state.secondaryDisplayAmount)
    : intl.formatNumberInput(this.state.primaryDisplayAmount)
  bottomDisplayAmount = () => this.state.isToggled ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount

  topRow = (denominationInfo: FlipInputFieldInfo, onChangeText: ((string) => void), amount: string) => {
    return (
      <View style={top.row} key={'top'}>
        <Text style={[top.symbol]}>
          {denominationInfo.displayDenomination.symbol}
        </Text>
        <TextInput style={[top.amount, (Platform.OS === 'ios') ? {} : {paddingBottom: 2}]}
          placeholder={'0'}
          placeholderTextColor={'rgba(255, 255, 255, 0.60)'}
          value={amount}
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
    )
  }

  bottomRow = (denominationInfo: FlipInputFieldInfo, amount: string) => {
    return (
      <TouchableWithoutFeedback onPress={this.onToggleFlipInput} key={'bottom'}>
        <View style={bottom.row}>
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
      </View>
    </TouchableWithoutFeedback>
    )
  }

  renderRows = (primaryInfo: FlipInputFieldInfo, secondaryInfo: FlipInputFieldInfo, isToggled: boolean) => {
    return (
      <View style={[styles.rows]}>
        {isToggled
          ? [
            this.topRow(secondaryInfo, this.onSecondaryAmountChange, this.topDisplayAmount()),
            this.bottomRow(primaryInfo, this.bottomDisplayAmount())
          ]
          : [
            this.topRow(primaryInfo, this.onPrimaryAmountChange, this.topDisplayAmount()),
            this.bottomRow(secondaryInfo, this.bottomDisplayAmount())
          ]}
      </View>
    )
  }

  render () {
    const {primaryInfo, secondaryInfo} = this.props
    const {isToggled} = this.state
    const frontAnimatedStyle = {
      transform: [
        { rotateX: this.frontInterpolate }
      ]
    }
    const backAnimatedStyle = {
      transform: [
        { rotateX: this.backInterpolate }
      ]
    }
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.container]}>
          <Animated.View style={[styles.flipContainerFront, frontAnimatedStyle]} pointerEvents={isToggled ? 'none' : 'auto'}>
            <View style={styles.flipButton}>
              <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name={Constants.SWAP_VERT} size={36} />
            </View>
            <View style={[styles.rows]}>
              {this.topRow(primaryInfo, this.onPrimaryAmountChange, this.state.primaryDisplayAmount)}
              {this.bottomRow(secondaryInfo, this.state.secondaryDisplayAmount)}
            </View>
            <View style={styles.spacer} />
          </Animated.View>
          <Animated.View style={[styles.flipContainerFront, styles.flipContainerBack, backAnimatedStyle]} pointerEvents={isToggled ? 'auto' : 'none'}>
            <View style={styles.flipButton}>
              <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name={Constants.SWAP_VERT} size={36} />
            </View>
            <View style={[styles.rows]}>
              {this.topRow(secondaryInfo, this.onSecondaryAmountChange, this.state.secondaryDisplayAmount)}
              {this.bottomRow(primaryInfo, this.state.primaryDisplayAmount)}
            </View>
            <View style={styles.spacer} />
          </Animated.View>
        </View>
      )
    }
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
