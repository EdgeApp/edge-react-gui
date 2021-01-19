// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { EdgeTextFieldOutlined } from './EdgeTextField.js'

type OwnProps = {
  searching: boolean,
  onChangeText?: (input: string) => void,
  onTextFieldFocus?: () => void,
  onTextFieldBlur?: (input: string) => void,
  onDoneSearching?: (input: string) => void,
  onClearText?: () => void
}

type State = {
  input: string
}

type Props = OwnProps & ThemeProps

class SearchListComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = { input: '' }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.searching === false && this.props.searching === true && this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  handleOnChangeText = (input: string) => {
    this.setState({ input })
    if (this.props.onChangeText) {
      this.props.onChangeText(input)
    }
  }

  handleTextFieldBlur = () => {
    if (this.props.onTextFieldBlur) {
      this.props.onTextFieldBlur(this.state.input)
    }
  }

  handleDoneSearching = () => {
    const textRef = this.textInput.current
    this.clearText()
    if (this.props.onDoneSearching) {
      this.props.onDoneSearching('')
    }
    if (textRef) {
      textRef.blur()
      textRef.clear()
    }
  }

  clearText = () => {
    this.setState({ input: '' })
    if (this.props.onClearText) {
      this.props.onClearText()
    }
  }

  render() {
    const { onTextFieldFocus, searching, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.container}>
        <View style={styles.textFieldContainer}>
          <EdgeTextFieldOutlined
            returnKeyType="search"
            label={s.strings.transaction_list_search}
            onChangeText={this.handleOnChangeText}
            value={this.state.input}
            onFocus={onTextFieldFocus}
            onBlur={this.handleTextFieldBlur}
            ref={this.textInput}
            isClearable={searching}
            onClear={this.clearText}
            marginRem={0}
          />
        </View>
        {searching && (
          <TouchableOpacity onPress={this.handleDoneSearching} style={styles.doneContainer}>
            <EdgeText style={styles.doneText}>{s.strings.string_done_cap}</EdgeText>
          </TouchableOpacity>
        )}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.rem(4.5)
  },
  textFieldContainer: {
    flex: 1
  },
  doneContainer: {
    height: theme.rem(3.5),
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingRight: 0,
    paddingBottom: theme.rem(0.5)
  },
  doneText: {
    color: theme.textLink
  }
}))

export const SearchList = withTheme(SearchListComponent)
