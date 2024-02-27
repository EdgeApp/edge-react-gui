import * as React from 'react'
import { ViewToken } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { StateProvinceData } from '../../types/types'
import { Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal'

interface Props {
  countryCode: string
  stateProvinces: StateProvinceData[]
  stateProvince?: string
  bridge: AirshipBridge<string>
}

interface StateCountryListViewToken extends ViewToken {
  item: StateProvinceData
}

export const StateProvinceListModal = ({ countryCode, stateProvinces: rawStateProvinces, stateProvince, bridge }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const [visibleRows, setVisibleRows] = React.useState<StateCountryListViewToken[]>([])

  const stateProvinces: StateProvinceData[] = []
  for (const sp of rawStateProvinces) {
    if (sp['alpha-2'] === stateProvince) stateProvinces.unshift(sp)
    else stateProvinces.push(sp)
  }

  const renderRow = React.useCallback(
    ({ name, 'alpha-2': alpha }: StateProvinceData) => {
      const source = { uri: `${FLAG_LOGO_URL}/stateprovinces/${countryCode.toLowerCase()}/${alpha.toLowerCase()}.png` }
      return <SelectableRow icon={<FastImage source={source} style={styles.image} />} subTitle={alpha} title={name} onPress={() => bridge.resolve(alpha)} />
    },
    [bridge, countryCode, styles.image]
  )

  const rowDataFilter = React.useCallback((searchText: string, stateProvince: StateProvinceData) => {
    const lowerCaseText = searchText.toLowerCase()
    const upperCaseText = searchText.toUpperCase()
    return stateProvince.name.toLowerCase().includes(lowerCaseText) || stateProvince['alpha-2'].includes(upperCaseText)
  }, [])

  const handleSubmitEditing = useHandler(() => {
    if (visibleRows.length > 0) {
      bridge.resolve(visibleRows[0].item['alpha-2'])
    }
  })

  const onViewableItemsChanged = useHandler((info: { viewableItems: ViewToken[] }) => {
    setVisibleRows(info.viewableItems)
  })

  return (
    <ListModal
      bridge={bridge}
      title={lstrings.buy_sell_crypto_select_state_button}
      label={lstrings.search_states}
      autoFocus
      rowsData={stateProvinces}
      onSubmitEditing={handleSubmitEditing}
      rowComponent={renderRow}
      rowDataFilter={rowDataFilter}
      onViewableItemsChanged={onViewableItemsChanged}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  }
}))
