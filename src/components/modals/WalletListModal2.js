// @flow

import * as React from 'react'

import s from '../../locales/strings.js'
import { EdgeTextFieldOutlined } from '../themed/EdgeTextField.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { WalletList } from '../themed/WalletList.js'
import { type AirshipBridge } from './modalParts.js'

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
  excludeCurrencyCodes?: string[]
}

type State = {
  search: string,
  searching: boolean
}

type Props = OwnProps

class WalletListMenuModalComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef()

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
    const { bridge, excludeWalletIds, allowedCurrencyCodes, excludeCurrencyCodes, showCreateWallet, headerTitle } = this.props
    const { search, searching } = this.state
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve({})}>
        <ModalTitle>{headerTitle}</ModalTitle>
        <EdgeTextFieldOutlined
          returnKeyType="search"
          label={s.strings.search_wallets}
          onChangeText={this.handleChangeSearchInput}
          onFocus={this.handleTextFieldFocus}
          onBlur={this.handleTextFieldBlur}
          ref={this.textInput}
          isClearable={searching}
          onClear={this.handleClearText}
          value={search}
          marginRem={[0, 0, 0.25, 0]}
        />
        <WalletList
          onPress={this.handleOnPress}
          showCreateWallet={showCreateWallet}
          excludeWalletIds={excludeWalletIds}
          allowedCurrencyCodes={allowedCurrencyCodes}
          excludeCurrencyCodes={excludeCurrencyCodes}
          searchText={search}
          searching={searching}
          isModal
        />
        <ModalCloseArrow onPress={() => bridge.resolve({})} />
      </ThemedModal>
    )
  }
}

export const WalletListModal = WalletListMenuModalComponent
