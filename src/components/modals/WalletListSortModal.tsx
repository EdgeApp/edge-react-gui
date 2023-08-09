import { asValue } from 'cleaners'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'
import { ListModal } from './ListModal'

const options = [
  ['manual', lstrings.wallet_list_sort_manual],
  ['name', lstrings.wallet_list_sort_name],
  ['currencyCode', lstrings.wallet_list_sort_currencyCode],
  ['currencyName', lstrings.wallet_list_sort_currencyName],
  ['highest', lstrings.wallet_list_sort_highest],
  ['lowest', lstrings.wallet_list_sort_lowest]
]

export const asSortOption = asValue('manual', 'name', 'currencyCode', 'currencyName', 'highest', 'lowest')
export type SortOption = ReturnType<typeof asSortOption>

interface Props {
  bridge: AirshipBridge<SortOption>
  sortOption: SortOption
}

export const WalletListSortModal = ({ bridge, sortOption }: Props) => {
  const renderRow = useHandler(([key, title]) => {
    return key === 'manual' ? (
      <SettingsTappableRow key={key} label={title} onPress={() => bridge.resolve(key)} />
    ) : (
      <SettingsRadioRow key={key} label={title} value={sortOption === key} onPress={() => bridge.resolve(key)} />
    )
  })

  return <ListModal bridge={bridge} title={lstrings.wallet_list_sort_title} textInput={false} rowsData={options} rowComponent={renderRow} fullScreen={false} />
}
