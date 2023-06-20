import * as React from 'react'
import { View, ViewToken } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useSelector } from '../../types/reactRedux'
import { GuiFiatType } from '../../types/types'
import { getSupportedFiats } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal'

interface Props {
  bridge: AirshipBridge<GuiFiatType>
}

interface FiatListViewToken extends ViewToken {
  item: GuiFiatType
}

export const FiatListModal = (props: Props) => {
  const { bridge } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const supportedFiats = React.useMemo(() => getSupportedFiats(defaultFiat).filter(item => FIAT_COUNTRY[item.value] != null), [defaultFiat])
  const [visibleRows, setVisibleRows] = React.useState<FiatListViewToken[]>([])

  const fiatModalRowFilter = (searchText: string, item: GuiFiatType) => {
    const lowerCaseText = searchText.toLowerCase()
    return (
      FIAT_COUNTRY[item.value]?.countryName.toLowerCase().includes(lowerCaseText) ||
      item.label.toLowerCase().includes(lowerCaseText) ||
      item.value.toLowerCase().includes(lowerCaseText)
    )
  }

  const renderFiatChoiceModalRow = (item: GuiFiatType) => {
    const fiatCountry = FIAT_COUNTRY[item.value]

    const key = `currency_label_${item.value}`
    const subTitle = lstrings[key as keyof typeof lstrings] ?? lstrings.currency_label_

    return (
      <SelectableRow
        icon={
          fiatCountry?.logoUrl != null ? (
            <FastImage source={{ uri: fiatCountry.logoUrl }} style={styles.image} accessibilityHint={item.value} />
          ) : (
            <View style={styles.image} />
          )
        }
        paddingRem={[0, 1]}
        subTitle={subTitle}
        title={item.value}
        onPress={() => bridge.resolve(item)}
      />
    )
  }

  const onViewableItemsChanged = useHandler((info: { viewableItems: ViewToken[] }) => {
    setVisibleRows(info.viewableItems)
  })

  const onSubmitEditing = useHandler(() => {
    if (visibleRows.length === 1) {
      bridge.resolve(visibleRows[0].item)
    }
  })

  return (
    <ListModal
      bridge={bridge}
      title={lstrings.title_create_wallet_select_fiat}
      label={lstrings.fragment_wallets_addwallet_fiat_hint}
      autoFocus
      blurOnClear={false}
      rowsData={supportedFiats}
      onSubmitEditing={onSubmitEditing}
      rowComponent={item => renderFiatChoiceModalRow(item)}
      rowDataFilter={fiatModalRowFilter}
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
