// @flow

import Clipboard from '@react-native-community/clipboard'
import { div, eq, mul } from 'biggystring'
import * as React from 'react'
import { type Event, Animated, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Menu, { MenuOption, MenuOptions, MenuTrigger, renderers } from 'react-native-popup-menu'
import Reamimated, { useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

import { Fontello } from '../../assets/vector'
import { formatNumberInput, prettifyNumber, truncateDecimals, truncateDecimalsPeriod } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { DECIMAL_PRECISION, truncateDecimals as truncateDecimalsUtils, zeroString } from '../../util/utils.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, useTheme, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { ButtonBox, RightChevronButton } from './ThemedButtons.js'

export type FlipInputFieldInfo = {
  currencyName: string,
  currencySymbol: string, // currency symbol of field
  currencyCode: string, // 3-5 digit currency code

  // Maximum number of decimals to allow the user to enter. FlipInput will automatically truncate use input to this
  // number of decimals as the user types.
  maxEntryDecimals: number,

  // Maximum number of decimals to convert from the opposite field to this field.
  // ie If the user is typing into the fiat field, and this FlipInputFieldInfo refers to a BTC field, then this is the number of
  // decimals to use when converting the fiat value into this crypto field.
  maxConversionDecimals: number
}

type State = {
  isToggled: boolean,
  textInputFrontFocus: boolean,
  textInputBackFocus: boolean,
  overridePrimaryDecimalAmount: string,
  forceUpdateGuiCounter: number,
  primaryDisplayAmount: string, // Actual display amount including 1000s separator and localized for region
  secondaryDisplayAmount: string, // Actual display amount including 1000s separator and localized for region
  primaryDecimalAmount: string,
  secondaryDecimalAmount: string,
  rerenderCounter: number
}

export type FlipInputOwnProps = {
  // Override value of the primary field. This will be the initial value of the primary field. Only changes to this value will
  // cause changes to the primary field
  overridePrimaryDecimalAmount: string,

  // Exchange rate
  exchangeSecondaryToPrimaryRatio: string,

  // Information regarding the primary and secondary field. Mostly related to currency name, code, and denominations
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo,
  onNext?: () => void,
  onFocus?: () => void,
  onBlur?: () => void,
  forceUpdateGuiCounter: number,

  // Callback when primaryDecimalAmount changes. **This is only called when the user types into a field or if
  // exchangeSecondaryToPrimaryRatio changes. This does NOT get called when overridePrimaryDecimalAmount is changed by the parent
  onAmountChanged(decimalAmount: string): void,
  isEditable: boolean,
  isFiatOnTop: boolean,
  isFocus: boolean,

  topReturnKeyType?: string,
  inputAccessoryViewID?: string,
  headerText: string,
  headerLogo: string | void,
  headerCallback?: () => void,
  keyboardVisible: boolean,
  flipInputRef: (FlipInput: any) => void,
  onError?: (error: string | void) => void
}

type Props = FlipInputOwnProps & ThemeProps

type Amounts = {
  primaryDecimalAmount: string,
  primaryDisplayAmount: string,
  secondaryDecimalAmount: string,
  secondaryDisplayAmount: string
}

export const sanitizeDecimalAmount = (amount: string, maxEntryDecimals: number): string => {
  // Replace all commas into periods
  amount = amount.replace(',', '.')

  // Remove characters except numbers and decimal separator
  amount = amount.replace(/[^0-9.]/g, '')

  // Trunctuate decimals to limited decimal entries, also remove additional periods
  return truncateDecimalsPeriod(amount, maxEntryDecimals)
}

const checkKeyPress = (keyPressed: string, decimalAmount: string) => {
  if (keyPressed === '.' && decimalAmount.includes('.')) {
    return false
  }

  if (keyPressed.match(/[^0-9.]/)) {
    return false
  }

  return true
}

// Assumes a US locale decimal input
const setPrimaryToSecondary = (props: Props, primaryDecimalAmount: string): Amounts => {
  // Formats into locale specific format. Add currency symbol
  const primaryDisplayAmount = formatNumberInput(prettifyNumber(primaryDecimalAmount))

  // Converts to secondary value using exchange rate
  let secondaryDecimalAmount = mul(primaryDecimalAmount, props.exchangeSecondaryToPrimaryRatio)

  // Truncate to however many decimals the secondary format should have
  secondaryDecimalAmount = truncateDecimalsUtils(secondaryDecimalAmount, props.secondaryInfo.maxConversionDecimals)

  // Format into locale specific format. Add currency symbol
  const secondaryDisplayAmount = formatNumberInput(prettifyNumber(secondaryDecimalAmount))

  // Set the state for display in render()
  return { primaryDecimalAmount, primaryDisplayAmount, secondaryDecimalAmount, secondaryDisplayAmount }
}

// Pretty much the same as setPrimaryToSecondary
const setSecondaryToPrimary = (props: Props, secondaryDecimalAmount: string): Amounts => {
  const secondaryDisplayAmount = formatNumberInput(prettifyNumber(secondaryDecimalAmount))
  const primaryAmountFull = zeroString(props.exchangeSecondaryToPrimaryRatio)
    ? '0'
    : div(secondaryDecimalAmount, props.exchangeSecondaryToPrimaryRatio, DECIMAL_PRECISION)
  const primaryDecimalAmount = truncateDecimalsUtils(primaryAmountFull, props.primaryInfo.maxConversionDecimals)
  const primaryDisplayAmount = formatNumberInput(prettifyNumber(primaryDecimalAmount))
  return { primaryDisplayAmount, primaryDecimalAmount, secondaryDisplayAmount, secondaryDecimalAmount }
}

const getInitialState = (props: Props) => {
  const state: State = {
    isToggled: false,
    textInputFrontFocus: false,
    textInputBackFocus: false,
    overridePrimaryDecimalAmount: '',
    primaryDisplayAmount: '',
    forceUpdateGuiCounter: 0,
    secondaryDisplayAmount: '',
    primaryDecimalAmount: '',
    secondaryDecimalAmount: '',
    rerenderCounter: 0
  }

  if (props.overridePrimaryDecimalAmount === '') return state

  const primaryDecimalAmount = sanitizeDecimalAmount(props.overridePrimaryDecimalAmount, props.primaryInfo.maxEntryDecimals)
  return Object.assign(state, setPrimaryToSecondary(props, primaryDecimalAmount))
}

class FlipInputComponent extends React.PureComponent<Props, State> {
  animatedValue: Animated.Value
  frontInterpolate: Animated.Value
  backInterpolate: Animated.Value
  androidFrontOpacityInterpolate: Animated.Value
  androidBackOpacityInterpolate: Animated.Value
  textInputFront: TextInput | null
  textInputBack: TextInput | null
  clipboardMenu: any

  constructor(props: Props) {
    super(props)
    this.state = getInitialState(props)

    // Mounting Animation
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

  componentDidMount() {
    this.props.flipInputRef(this)
    setTimeout(() => {
      if (this.props.keyboardVisible && eq(this.props.overridePrimaryDecimalAmount, '0') && this.textInputFront) {
        this.textInputFront.focus()
      }
    }, 400)

    if (this.props.isFiatOnTop) {
      this.setState({
        isToggled: !this.state.isToggled
      })
      Animated.timing(this.animatedValue, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true
      }).start()
    }

    if (this.props.isFocus) {
      setTimeout(() => {
        if (this.state.isToggled) {
          const { exchangeSecondaryToPrimaryRatio } = this.props
          if (zeroString(exchangeSecondaryToPrimaryRatio)) {
            this.toggleCryptoOnBottom()
          } else {
            this.textInputBack && this.textInputBack.focus()
          }
        } else {
          this.textInputFront && this.textInputFront.focus()
        }
      }, 650)
    }
  }

  componentWillUnmount() {
    this.props.flipInputRef(null)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    // Check if primary changed first. Don't bother to check secondary if parent passed in a primary
    if (
      nextProps.overridePrimaryDecimalAmount !== this.state.overridePrimaryDecimalAmount ||
      nextProps.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter
    ) {
      const result = setPrimaryToSecondary(nextProps, sanitizeDecimalAmount(nextProps.overridePrimaryDecimalAmount, nextProps.primaryInfo.maxEntryDecimals))
      this.setState({
        ...result,
        overridePrimaryDecimalAmount: nextProps.overridePrimaryDecimalAmount,
        forceUpdateGuiCounter: nextProps.forceUpdateGuiCounter
      })
    } else {
      // Checks and apply exchange rates
      if (!this.state.isToggled) {
        this.setState(setPrimaryToSecondary(nextProps, this.state.primaryDecimalAmount))
      } else {
        this.setState(setSecondaryToPrimary(nextProps, this.state.secondaryDecimalAmount))
      }
    }
    if (nextProps.primaryInfo.currencyCode !== this.props.primaryInfo.currencyCode) {
      setTimeout(() => this.onKeyPress('0', '', this.props.primaryInfo.maxEntryDecimals, setPrimaryToSecondary), 50)
    }
  }

  // Used on parent ExchangedFlipInput
  toggleCryptoOnBottom = () => {
    if (this.state.isToggled) {
      this.onToggleFlipInput()
    }
  }

  // Used on refs parent (Request Scene)
  textInputBottomFocus = () => {
    if (this.state.isToggled) {
      if (this.textInputBack) {
        this.textInputBack.focus()
      }
    } else {
      if (this.textInputFront) {
        this.textInputFront.focus()
      }
    }
  }

  // Used on refs parent (Request Scene)
  textInputBottomBlur = () => {
    if (this.state.isToggled) {
      if (this.textInputBack) {
        this.textInputBack.blur()
      }
    } else {
      if (this.textInputFront) {
        this.textInputFront.blur()
      }
    }
  }

  onToggleFlipInput = () => {
    this.clipboardMenu.close()
    this.setState({
      isToggled: !this.state.isToggled
    })
    if (this.state.isToggled) {
      if (this.textInputFront) {
        this.textInputFront.focus()
      }
      Animated.spring(this.animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true
      }).start()
    }
    if (!this.state.isToggled) {
      if (this.textInputBack) {
        this.textInputBack.focus()
      }
      Animated.spring(this.animatedValue, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true
      }).start()
    }
  }

  async openClipboardMenu() {
    this.clipboardMenu.close()
    try {
      if ((this.state.textInputFrontFocus || this.state.textInputBackFocus) && (await Clipboard.getString())) {
        this.clipboardMenu.open()
      }
    } catch (error) {
      showError(error)
    }
  }

  handlePasteClipboard = async () => {
    try {
      const clipboard = await Clipboard.getString()
      this.setStateAmounts('', setSecondaryToPrimary)
      if (this.state.isToggled) {
        for (const string of clipboard.split('')) {
          this.onKeyPress(string, this.state.secondaryDecimalAmount, this.props.secondaryInfo.maxEntryDecimals, setSecondaryToPrimary)
        }
      } else {
        for (const string of clipboard.split('')) {
          this.onKeyPress(string, this.state.primaryDecimalAmount, this.props.primaryInfo.maxEntryDecimals, setPrimaryToSecondary)
        }
      }
    } catch (error) {
      showError(error)
    }
  }

  getTextInputFrontRef = (ref: TextInput | null) => {
    this.textInputFront = ref
  }

  textInputFrontFocusTrue = () => {
    this.setState({ textInputFrontFocus: true, rerenderCounter: this.state.rerenderCounter + 1 })
    if (this.props.onFocus) this.props.onFocus()
  }

  textInputFrontFocusFalse = () => {
    this.setState({ textInputFrontFocus: false })
    if (this.props.onBlur) this.props.onBlur()
  }

  textInputFrontFocus = async () => {
    this.openClipboardMenu()
    const { textInputFront } = this
    if (textInputFront != null) {
      textInputFront.blur()
      textInputFront.focus()
    }
  }

  handleOnError(error?: string) {
    if (this.props.onError != null) {
      this.props.onError(error)
    }
  }

  clearError() {
    this.handleOnError()
  }

  onKeyPress(keyPressed: string, decimalAmount: string, maxEntryDecimals: number, setAmounts: (Props, string) => Amounts) {
    keyPressed = keyPressed.replace(',', '.')
    if (keyPressed === 'Backspace') {
      this.setStateAmounts(truncateDecimals(decimalAmount.slice(0, -1), maxEntryDecimals), setAmounts)
    } else if (!checkKeyPress(keyPressed, decimalAmount)) {
      this.handleOnError(s.strings.invalid_character_error)
    } else {
      this.clearError()
      this.setStateAmounts(truncateDecimals(decimalAmount + keyPressed, maxEntryDecimals), setAmounts)
    }
  }

  setStateAmounts(decimalAmount: string, setAmounts: (Props, string) => Amounts) {
    const amounts = setAmounts(this.props, decimalAmount)
    this.setState(amounts, () => this.props.onAmountChanged(amounts.primaryDecimalAmount))
  }

  onPrimaryChangeText = (value: string) => {
    // Hack on android where to only get the number farthest to the right
    if (Platform.OS === 'ios') return
    if (value.match(/[^0-9]/)) return
    this.onKeyPress(value.slice(value.length - 1), this.state.primaryDecimalAmount, this.props.primaryInfo.maxEntryDecimals, setPrimaryToSecondary)
  }

  onPrimaryKeyPress = (e: Event) => {
    if (Platform.OS === 'android' && e.nativeEvent.key.match(/[0-9]/)) return
    this.onKeyPress(e.nativeEvent.key, this.state.primaryDecimalAmount, this.props.primaryInfo.maxEntryDecimals, setPrimaryToSecondary)
  }

  getTextInputBackRef = (ref: TextInput | null) => {
    this.textInputBack = ref
  }

  textInputBackFocusTrue = () => {
    this.setState({ textInputBackFocus: true })
    if (this.props.onFocus) this.props.onFocus()
  }

  textInputBackFocusFalse = () => {
    this.setState({ textInputBackFocus: false })
    if (this.props.onBlur) this.props.onBlur()
  }

  textInputBackFocus = async () => {
    this.openClipboardMenu()
    const { textInputBack } = this
    if (textInputBack != null) {
      textInputBack.blur()
      textInputBack.focus()
    }
  }

  onSecondaryChangeText = (value: string) => {
    // Hack on android where to only get the number farthest to the right
    if (Platform.OS === 'ios') return
    if (value.match(/[^0-9]/)) return
    this.onKeyPress(value.slice(value.length - 1), this.state.secondaryDecimalAmount, this.props.secondaryInfo.maxEntryDecimals, setSecondaryToPrimary)
  }

  onSecondaryKeyPress = (e: Event) => {
    if (Platform.OS === 'android' && e.nativeEvent.key.match(/[0-9]/)) return
    this.onKeyPress(e.nativeEvent.key, this.state.secondaryDecimalAmount, this.props.secondaryInfo.maxEntryDecimals, setSecondaryToPrimary)
  }

  bottomRow = (isFront: boolean) => {
    const { isEditable, inputAccessoryViewID, onNext, topReturnKeyType, theme } = this.props
    const { textInputBackFocus, textInputFrontFocus } = this.state
    const showCursor = textInputBackFocus || textInputFrontFocus
    const styles = getStyles(theme)
    let displayAmount = isFront ? this.state.primaryDisplayAmount : this.state.secondaryDisplayAmount
    if (displayAmount === '0') displayAmount = ''
    const decimalAmount = isFront ? this.state.primaryDecimalAmount : this.state.secondaryDecimalAmount
    const currencyName = isFront ? this.props.primaryInfo.currencyName : this.props.secondaryInfo.currencyName
    const onPress = isFront ? this.textInputFrontFocus : this.textInputBackFocus
    const onChangeText = isFront ? this.onPrimaryChangeText : this.onSecondaryChangeText
    const onKeyPress = isFront ? this.onPrimaryKeyPress : this.onSecondaryKeyPress
    const onFocus = isFront ? this.textInputFrontFocusTrue : this.textInputBackFocusTrue
    const onBlur = isFront ? this.textInputFrontFocusFalse : this.textInputBackFocusFalse
    const ref = isFront ? this.getTextInputFrontRef : this.getTextInputBackRef
    const displayAmountCheck = (decimalAmount.match(/^0*$/) && !showCursor) || displayAmount === ''
    const displayAmountString = displayAmountCheck ? s.strings.string_amount : displayAmount
    const displayAmountStyle = displayAmountCheck ? styles.bottomAmountMuted : styles.bottomAmount
    const currencyNameStyle = displayAmountCheck ? styles.bottomCurrencyMuted : styles.bottomCurrency

    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.bottomContainer} key="bottom">
          {displayAmount === '' ? (
            <View style={styles.valueContainer}>
              <BlinkingCursor showCursor={showCursor} />
              <EdgeText style={displayAmountStyle}>{displayAmountString}</EdgeText>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <EdgeText style={displayAmountStyle}>{displayAmountString}</EdgeText>
              <BlinkingCursor showCursor={showCursor} />
            </View>
          )}
          <EdgeText style={currencyNameStyle}>{currencyName}</EdgeText>
          <TextInput
            style={styles.hiddenTextInput}
            value=""
            onChangeText={onChangeText}
            onKeyPress={onKeyPress}
            autoCorrect={false}
            keyboardType="numeric"
            returnKeyType={topReturnKeyType || 'done'}
            ref={ref}
            onFocus={onFocus}
            onBlur={onBlur}
            editable={isEditable}
            onSubmitEditing={onNext}
            inputAccessoryViewID={inputAccessoryViewID || null}
          />
        </View>
      </TouchableWithoutFeedback>
    )
  }

  topRow = (fieldInfo: FlipInputFieldInfo, amount: string) => {
    const bottomText = `${amount} ${fieldInfo.currencyName}`
    return (
      <TouchableWithoutFeedback onPress={this.onToggleFlipInput} key="bottom">
        <EdgeText>{bottomText}</EdgeText>
      </TouchableWithoutFeedback>
    )
  }

  clipboardRef = (ref: any) => (this.clipboardMenu = ref)

  render() {
    const { primaryInfo, secondaryInfo, headerText, headerLogo, headerCallback, theme } = this.props
    const { isToggled } = this.state
    const frontAnimatedStyle = { transform: [{ rotateX: this.frontInterpolate }] }
    const backAnimatedStyle = { transform: [{ rotateX: this.backInterpolate }] }
    const styles = getStyles(theme)

    return (
      <>
        <TouchableOpacity onPress={headerCallback} style={styles.headerContainer}>
          {headerLogo ? <FastImage style={styles.headerIcon} source={{ uri: headerLogo }} /> : null}
          {headerCallback ? <RightChevronButton text={headerText} onPress={headerCallback} /> : <EdgeText style={styles.headerText}>{headerText}</EdgeText>}
        </TouchableOpacity>
        <View style={styles.clipboardContainer}>
          <Menu onSelect={this.handlePasteClipboard} ref={this.clipboardRef} renderer={renderers.Popover} rendererProps={{ placement: 'top' }}>
            <MenuTrigger />
            <MenuOptions>
              <MenuOption>
                <EdgeText style={styles.clipboardText}>{s.strings.string_paste}</EdgeText>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
        <View style={styles.flipInputContainer}>
          <View style={styles.flipInput}>
            <Animated.View
              style={[styles.flipInputFront, frontAnimatedStyle, { opacity: this.androidFrontOpacityInterpolate }]}
              pointerEvents={isToggled ? 'none' : 'auto'}
            >
              {this.topRow(secondaryInfo, this.state.secondaryDisplayAmount)}
              {this.bottomRow(true)}
            </Animated.View>
            <Animated.View
              style={[styles.flipInputFront, styles.flipContainerBack, backAnimatedStyle, { opacity: this.androidBackOpacityInterpolate }]}
              pointerEvents={isToggled ? 'auto' : 'none'}
            >
              {this.topRow(primaryInfo, this.state.primaryDisplayAmount)}
              {this.bottomRow(false)}
            </Animated.View>
          </View>
          <ButtonBox onPress={this.onToggleFlipInput} paddingRem={[0.5, 0, 0.5, 1]}>
            <Fontello style={styles.flipIcon} name="exchange" color={theme.iconTappable} size={theme.rem(1.75)} />
          </ButtonBox>
        </View>
      </>
    )
  }
}

const BlinkingCursor = ({ showCursor }: { showCursor: boolean }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: showCursor ? withRepeat(withSequence(withDelay(500, withTiming(1, { duration: 1 })), withDelay(500, withTiming(0, { duration: 1 }))), -1) : 0
  }))

  return (
    // eslint-disable-next-line react-native/no-raw-text
    <Reamimated.Text style={[styles.bottomAmount, styles.blinkingCursor, Platform.OS === 'android' ? styles.blinkingCursorandroidAdjust : null, animatedStyle]}>
      |
    </Reamimated.Text>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Header
  headerContainer: {
    marginRight: Platform.OS === 'ios' ? theme.rem(3.5) : theme.rem(1.5), // Different because adjustsFontSizeToFit behaves differently on android vs ios
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(1)
  },
  headerIcon: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    marginRight: theme.rem(1)
  },
  headerText: {
    fontWeight: '600',
    fontSize: theme.rem(1.0)
  },

  // Flip Input
  flipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  flipInput: {
    flex: 1,
    paddingRight: theme.rem(0.5)
  },
  flipInputFront: {
    backfaceVisibility: 'hidden'
  },
  flipContainerBack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  flipIcon: {
    marginRight: -theme.rem(0.125)
  },

  // Top Amount
  bottomContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(1.5),
    minHeight: theme.rem(2)
  },
  valueContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(0.5)
  },
  bottomAmount: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.5),
    minHeight: theme.rem(1.5)
  },
  bottomAmountMuted: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.5),
    marginLeft: theme.rem(-0.1), // Hack because of amount being bigger font size not aligning to the rest of the text on justified left
    color: theme.deactivatedText
  },
  bottomCurrency: {
    paddingTop: theme.rem(0.125)
  },
  bottomCurrencyMuted: {
    paddingTop: theme.rem(0.125),
    color: theme.deactivatedText
  },
  blinkingCursor: {
    color: theme.deactivatedText,
    includeFontPadding: false
  },
  blinkingCursorandroidAdjust: {
    top: -1
  },
  hiddenTextInput: {
    position: 'absolute',
    width: 0,
    height: 0
  },

  // Clipboard Popup
  clipboardContainer: {
    height: 0,
    width: '8%',
    top: theme.rem(0.5),
    alignItems: 'flex-end'
  },
  clipboardText: {
    color: theme.clipboardPopupText,
    padding: theme.rem(0.25)
  }
}))

const FlipInputThemed = withTheme(FlipInputComponent)

// $FlowFixMe - forwardRef is not recognize by flow?
export const FlipInput = React.forwardRef((props, ref) => <FlipInputThemed {...props} flipInputRef={ref} />) // eslint-disable-line
