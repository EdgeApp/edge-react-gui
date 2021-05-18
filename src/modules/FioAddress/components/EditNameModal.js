// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeTextFieldOutlined } from '../../../components/themed/EdgeTextField.js'
import { ModalCloseArrow, ModalTitle } from '../../../components/themed/ModalParts.js'
import { ThemedModal } from '../../../components/themed/ThemedModal.js'
import * as Constants from '../../../constants/indexConstants'
import { type RootState } from '../../../types/reduxTypes'

type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null
}

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  value: string,
  label: string,
  title: string
}

type State = {
  input: string,
  isFocused: boolean
}

type Props = OwnProps & ThemeProps & StateProps

class EditNameModalComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef()
  constructor(props: Props) {
    super(props)
    this.state = {
      input: this.props.value || '',
      isFocused: false
    }
  }

  componentDidMount(): * {
    this.setState({ input: this.props.value })
    if (this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  clearText = () => {
    this.setState({ input: '' })
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  fieldOnFocus = () => {
    this.setState({ isFocused: true })
  }

  fieldOnBlur = () => {
    this.setState({ isFocused: false })
  }

  onClose = () => this.props.bridge.resolve(null)

  onChange = (input: string) => this.setState({ input })

  selectItem = () => this.props.bridge.resolve(this.state.input)

  render() {
    const { bridge, title, label, theme } = this.props
    const { input, isFocused } = this.state
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={this.onClose} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 3, 1]}>
          {title}
        </ModalTitle>
        <View style={styles.field}>
          <EdgeTextFieldOutlined
            autoFocus
            keyboardType="default"
            label={label}
            onChangeText={this.onChange}
            onSubmitEditing={this.selectItem}
            value={input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="next"
            onFocus={this.fieldOnFocus}
            onBlur={this.fieldOnBlur}
            onClear={this.clearText}
            isClearable={isFocused}
            marginRem={[0, 1]}
            ref={this.textInput}
            blurOnSubmit
          />
        </View>
        <ModalCloseArrow onPress={this.onClose} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  field: {
    marginHorizontal: theme.rem(0.75)
  }
}))

export const EditNameModal = connect((state: RootState): StateProps => {
  const { account } = state.core
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  return {
    userDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets,
    fioPlugin
  }
})(withTheme(EditNameModalComponent))
