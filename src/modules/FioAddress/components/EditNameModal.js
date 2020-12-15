// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeTextField } from '../../../components/themed/EdgeTextField.js'
import { ModalCloseArrow, ModalTitle } from '../../../components/themed/ModalParts.js'
import { PrimaryButton } from '../../../components/themed/ThemedButtons'
import { ThemedModal } from '../../../components/themed/ThemedModal.js'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { type RootState } from '../../../types/reduxTypes'
import { getFioWallets } from '../../UI/selectors'

type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null
}

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  value: string
}

type State = {
  input: string
}

type Props = OwnProps & ThemeProps & StateProps

class EditNameModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: this.props.value || ''
    }
  }

  componentDidMount(): * {
    this.setState({ input: this.props.value })
  }

  onChange = input => this.setState({ input })

  selectItem = (value: any) => this.props.bridge.resolve(value)

  render() {
    const { bridge, theme } = this.props
    const { input } = this.state
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)} paddingRem={0}>
        <ModalTitle>{s.strings.fio_address_choose_label}</ModalTitle>
        <View style={styles.field}>
          <EdgeTextField
            autoFocus
            keyboardType="default"
            label=""
            onChangeText={this.onChange}
            onSubmitEditing={() => this.selectItem(input)}
            value={input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        <PrimaryButton label={s.strings.submit} onPress={() => this.selectItem(input)} marginRem={1} />
        <ModalCloseArrow onPress={() => bridge.resolve(null)} />
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
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  return {
    userDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets,
    fioPlugin
  }
})(withTheme(EditNameModalComponent))
