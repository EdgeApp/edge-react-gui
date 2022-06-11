// @flow

import { asValue } from 'cleaners'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'
import { ListModal } from './ListModal.js'

const options = [
  ['manual', s.strings.wallet_list_sort_manual],
  ['name', s.strings.wallet_list_sort_name],
  ['currencyCode', s.strings.wallet_list_sort_currencyCode],
  ['currencyName', s.strings.wallet_list_sort_currencyName],
  ['highest', s.strings.wallet_list_sort_highest],
  ['lowest', s.strings.wallet_list_sort_lowest]
]

export const asSortOption = asValue('manual', 'name', 'currencyCode', 'currencyName', 'highest', 'lowest')
export type SortOption = $Call<typeof asSortOption>

type Props = {
  bridge: AirshipBridge<SortOption>,
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

  return <ListModal bridge={bridge} title={s.strings.wallet_list_sort_title} textInput={false} rowsData={options} rowComponent={renderRow} fullScreen={false} />
}
