// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { WalletList } from '../themed/WalletList.js'

export type WalletListResult = {
  walletId?: string,
  currencyCode?: string
}

type OwnProps = {
  bridge: AirshipBridge<WalletListResult>,
  headerTitle: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[],
  filterActivation?: boolean
}

type State = {
  search: string,
  searching: boolean
}

type Props = OwnProps

export class WalletListModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { search: '', searching: false }
  }

  handleOnPress = (walletId: string, currencyCode: string) => this.props.bridge.resolve({ walletId, currencyCode })

  handleChangeSearchInput = (search: string) => this.setState({ search })

  handleTextFieldFocus = () => this.setState({ searching: true })

  handleTextFieldBlur = () => this.setState({ searching: false })

  handleClearText = () => this.setState({ search: '' })

  render() {
    const { bridge, excludeWalletIds, allowedCurrencyCodes, excludeCurrencyCodes, showCreateWallet, headerTitle, filterActivation } = this.props
    const { search, searching } = this.state
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve({})}>
        <ModalTitle center>{headerTitle}</ModalTitle>
        <OutlinedTextInput
          returnKeyType="search"
          label={s.strings.search_wallets}
          onChangeText={this.handleChangeSearchInput}
          onFocus={this.handleTextFieldFocus}
          onBlur={this.handleTextFieldBlur}
          onClear={this.handleClearText}
          value={search}
          marginRem={[0.5, 0.75, 1.25]}
          searchIcon
        />
        <WalletList
          onPress={this.handleOnPress}
          showCreateWallet={showCreateWallet}
          excludeWalletIds={excludeWalletIds}
          allowedCurrencyCodes={allowedCurrencyCodes}
          excludeCurrencyCodes={excludeCurrencyCodes}
          searchText={search}
          searching={searching}
          filterActivation={filterActivation}
          isModal
        />
        <ModalCloseArrow onPress={() => bridge.resolve({})} />
      </ThemedModal>
    )
  }
}
