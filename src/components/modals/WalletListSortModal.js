// @flow

import { asValue } from 'cleaners'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { updateWalletsSort } from '../../actions/WalletListActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'
import { ThemedModal } from '../themed/ThemedModal.js'

const options = [
  { key: 'manual', title: s.strings.wallet_list_sort_manual },
  { key: 'name', title: s.strings.wallet_list_sort_name },
  { key: 'currencyCode', title: s.strings.wallet_list_sort_currencyCode },
  { key: 'currencyName', title: s.strings.wallet_list_sort_currencyName },
  { key: 'highest', title: s.strings.wallet_list_sort_highest },
  { key: 'lowest', title: s.strings.wallet_list_sort_lowest }
]

export const asSortOption = asValue('default', 'name', 'currencyCode', 'currencyName', 'highest', 'lowest')
export type SortOption = $Call<typeof asSortOption>

type OwnProps = {
  bridge: AirshipBridge<'manual' | void>
}

type StateProps = {
  sortOption: SortOption
}

type DispatchProps = {
  updateWalletsSort: (sortOption: SortOption) => void
}

type State = {
  option: SortOption
}

type Props = OwnProps & StateProps & DispatchProps

class WalletListSortModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      option: props.sortOption
    }
  }

  handleCloseModal = () => {
    this.props.updateWalletsSort(this.state.option)
    this.props.bridge.resolve()
  }

  handleManualOption = () => {
    this.props.updateWalletsSort('default')
    this.props.bridge.resolve('manual')
  }

  handleOptionKey = (option: SortOption) => (this.state.option === option ? this.setState({ option: 'default' }) : this.setState({ option }))

  render() {
    const { bridge } = this.props
    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCloseModal}>
        <ModalTitle>{s.strings.wallet_list_sort_title}</ModalTitle>
        {options.map(option => {
          if (option.key === 'manual') {
            return <SettingsTappableRow key={option.key} label={option.title} onPress={this.handleManualOption} />
          } else {
            return (
              <SettingsRadioRow
                key={option.key}
                label={option.title}
                value={this.state.option === option.key}
                onPress={() => this.handleOptionKey(option.key)}
              />
            )
          }
        })}
        <ModalCloseArrow onPress={this.handleCloseModal} />
      </ThemedModal>
    )
  }
}

export const WalletListSortModal = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    sortOption: state.ui.settings.walletsSort
  }),
  dispatch => ({
    updateWalletsSort(sortOption: SortOption) {
      dispatch(updateWalletsSort(sortOption))
    }
  })
)(WalletListSortModalComponent)
