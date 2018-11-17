// @flow

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { Animated, Platform, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

import * as Constants from '../../../../constants/indexConstants'
import { intl } from '../../../../locales/intl'
import type { FlipInputFieldInfo } from '../../../../types'
import * as UTILS from '../../../../util/utils.js'
import { bottom, styles, top } from './styles.js'

type State = {
  isToggled: boolean,
  textInputFrontFocus: boolean,
  textInputBackFocus: boolean,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string
}

type Props = {
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string,
  isValidInput: string => boolean,
  onPrimaryAmountChange: string => void,
  onSecondaryAmountChange: string => void,
  isEditable: boolean
}

const getInitialState = (props: Props) => ({
  isToggled: false,
  textInputFrontFocus: false,
  textInputBackFocus: false,
  primaryDisplayAmount: props.primaryDisplayAmount || '',
  secondaryDisplayAmount: props.secondaryDisplayAmount || ''
})

export default class FlipInput extends Component<Props, State> {
  animatedValue: Animated.Value
  frontInterpolate: Animated.Value
  backInterpolate: Animated.Value
  androidFrontOpacityInterpolate: Animated.Value
  androidBackOpacityInterpolate: Animated.Value
  textInputFront: TextInput
  textInputBack: TextInput

  constructor (props: Props) {
    super(props)
    this.state = getInitialState(props)
  }
  onToggleFlipInput = () => {
    this.setState({
      isToggled: !this.state.isToggled
    })
    if (this.state.isToggled) {
      if (this.state.textInputBackFocus) {
        this.textInputFront.focus()
      }
      Animated.spring(this.animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10
      }).start()
    }
    if (!this.state.isToggled) {
      if (this.state.textInputFrontFocus) {
        this.textInputBack.focus()
      }
      Animated.spring(this.animatedValue, {
        toValue: 1,
        friction: 8,
        tension: 10
      }).start()
    }
  }
  UNSAFE_componentWillMount () {
    this.animatedValue = new Animated.Value(0)
    this.frontInterpolate = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    })
    this.backInterpolate = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg']
    })
    this.androidFrontOpacityInterpolate = this.animatedValue.interpolate({
      inputRange: [0, 0.5, 0.5],
      outputRange: [1, 1, 0]
    })
    this.androidBackOpacityInterpolate = this.animatedValue.interpolate({
      inputRange: [0.5, 0.5, 1],
      outputRange: [0, 1, 1]
    })
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
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
    if (nextProps.primaryInfo.displayCurrencyCode !== this.props.primaryInfo.displayCurrencyCode) {
      setTimeout(() => this.onPrimaryAmountChange('0'), 50)
    }
  }

  onPrimaryAmountChange = (primaryDisplayAmount: string) => {
    if (!intl.isValidInput(primaryDisplayAmount)) {
      return
    }
    const formattedPrimaryDisplayAmount = intl.formatToNativeNumber(intl.truncateDecimals(intl.prettifyNumber(primaryDisplayAmount), 8))
    this.setState(
      {
        primaryDisplayAmount: formattedPrimaryDisplayAmount
      },
      this.props.onPrimaryAmountChange(formattedPrimaryDisplayAmount)
    )
  }

  onSecondaryAmountChange = (secondaryDisplayAmount: string) => {
    if (!intl.isValidInput(secondaryDisplayAmount)) {
      return
    }
    const formattedSecondaryDisplayAmount = intl.formatToNativeNumber(intl.truncateDecimals(intl.prettifyNumber(secondaryDisplayAmount), 2))
    this.setState(
      {
        secondaryDisplayAmount: formattedSecondaryDisplayAmount
      },
      () => this.props.onSecondaryAmountChange(formattedSecondaryDisplayAmount)
    )
  }

  topDisplayAmount = () =>
    this.state.isToggled ? intl.formatNumberInput(this.state.secondaryDisplayAmount) : intl.formatNumberInput(this.state.primaryDisplayAmount)
  bottomDisplayAmount = () => (this.state.isToggled ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount)

  topRowFront = (denominationInfo: FlipInputFieldInfo, onChangeText: string => void, amount: string) => {
    return (
      <View style={top.row} key={'top'}>
        <Text style={[top.symbol]}>{denominationInfo.displayDenomination.symbol}</Text>
        <TextInput
          style={[top.amount, Platform.OS === 'ios' ? {} : { paddingBottom: 2 }]}
          placeholder={'0'}
          placeholderTextColor={'rgba(255, 255, 255, 0.60)'}
          value={amount}
          onChangeText={onChangeText}
          autoCorrect={false}
          keyboardType="numeric"
          selectionColor="white"
          returnKeyType="done"
          underlineColorAndroid={'transparent'}
          ref={ref => {
            this.textInputFront = ref
          }}
          onFocus={() => this.setState({ textInputFrontFocus: true })}
          onBlur={() => this.setState({ textInputFrontFocus: false })}
          editable={this.props.isEditable}
        />
        <Text style={[top.currencyCode]}>{denominationInfo.displayDenomination.name}</Text>
      </View>
    )
  }

  topRowBack = (denominationInfo: FlipInputFieldInfo, onChangeText: string => void, amount: string) => {
    return (
      <View style={top.row} key={'top'}>
        <Text style={[top.symbol]}>{denominationInfo.displayDenomination.symbol}</Text>
        <TextInput
          style={[top.amount, Platform.OS === 'ios' ? {} : { paddingBottom: 2 }]}
          placeholder={'0'}
          placeholderTextColor={'rgba(255, 255, 255, 0.60)'}
          value={amount}
          onChangeText={onChangeText}
          autoCorrect={false}
          keyboardType="numeric"
          selectionColor="white"
          returnKeyType="done"
          underlineColorAndroid={'transparent'}
          ref={ref => {
            this.textInputBack = ref
          }}
          onFocus={() => this.setState({ textInputBackFocus: true })}
          onBlur={() => this.setState({ textInputBackFocus: false })}
          editable={this.props.isEditable}
        />
        <Text style={[top.currencyCode]}>{denominationInfo.displayDenomination.name}</Text>
      </View>
    )
  }

  bottomRow = (denominationInfo: FlipInputFieldInfo, amount: string) => {
    return (
      <TouchableWithoutFeedback onPress={this.onToggleFlipInput} key={'bottom'}>
        <View style={bottom.row}>
          <Text style={[bottom.symbol]}>{denominationInfo.displayDenomination.symbol}</Text>
          <Text style={[bottom.amount, !amount && bottom.alert]} numberOfLines={1} ellipsizeMode="tail">
            {amount || '0'}
          </Text>
          <Text style={[bottom.currencyCode]}>{denominationInfo.displayDenomination.name}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  render () {
    const { primaryInfo, secondaryInfo } = this.props
    const { isToggled } = this.state
    const frontAnimatedStyle = {
      transform: [{ rotateX: this.frontInterpolate }]
    }
    const backAnimatedStyle = {
      transform: [{ rotateX: this.backInterpolate }]
    }
    return (
      <View style={[styles.container]}>
        <Animated.View
          style={[styles.flipContainerFront, frontAnimatedStyle, { opacity: this.androidFrontOpacityInterpolate }]}
          pointerEvents={isToggled ? 'none' : 'auto'}
        >
          <View style={styles.flipButton}>
            <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name={Constants.SWAP_VERT} size={36} />
          </View>
          <View style={[styles.rows]}>
            {this.topRowFront(primaryInfo, this.onPrimaryAmountChange, intl.formatNumberInput(this.state.primaryDisplayAmount))}
            {this.bottomRow(secondaryInfo, intl.formatNumberInput(this.state.secondaryDisplayAmount))}
          </View>
          <View style={styles.spacer} />
        </Animated.View>
        <Animated.View
          style={[styles.flipContainerFront, styles.flipContainerBack, backAnimatedStyle, { opacity: this.androidBackOpacityInterpolate }]}
          pointerEvents={isToggled ? 'auto' : 'none'}
        >
          <View style={styles.flipButton}>
            <FAIcon style={[styles.flipIcon]} onPress={this.onToggleFlipInput} name={Constants.SWAP_VERT} size={36} />
          </View>
          <View style={[styles.rows]}>
            {this.topRowBack(secondaryInfo, this.onSecondaryAmountChange, intl.formatNumberInput(this.state.secondaryDisplayAmount))}
            {this.bottomRow(primaryInfo, intl.formatNumberInput(this.state.primaryDisplayAmount))}
          </View>
          <View style={styles.spacer} />
        </Animated.View>
      </View>
    )
  }
}
