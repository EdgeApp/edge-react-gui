import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { normalizeForSearch } from '../../util/utils'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeText } from '../themed/EdgeText'
import { ListModal } from './ListModal'

export interface RecipientAssetRow {
  /**
   * What the row resolves to, and the suffix of its `testID`. A label cannot
   * identify a row: several chains share a currency code, and a token can
   * share both its name and its code with a chain.
   */
  value: string
  icon: React.ReactNode
  /** The asset's own name, such as "Ethereum" or "Tether". */
  name: string
  /** The network the asset is paid out on, such as "Optimism Network". */
  network: string
  currencyCode: string
}

interface Props {
  bridge: AirshipBridge<string | undefined>
  title: string
  searchPlaceholder: string
  rows: RecipientAssetRow[]
}

/**
 * Picks the asset a swap-send pays out. Every row names the asset and the
 * network it lives on, since the same asset is offered on several networks.
 */
export const RecipientAssetListModal: React.FC<Props> = props => {
  const { bridge, rows, searchPlaceholder, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleRowDataFilter = useHandler(
    (filterText: string, row: RecipientAssetRow): boolean => {
      const search = normalizeForSearch(filterText)
      return (
        normalizeForSearch(row.name).includes(search) ||
        normalizeForSearch(row.network).includes(search) ||
        normalizeForSearch(row.currencyCode).includes(search)
      )
    }
  )

  // `ListModal` resolves its bridge with the raw search text on submit, which
  // would close this modal on a return key press without picking anything.
  // There is nothing to submit here: the keyboard still dismisses itself.
  const handleSubmitEditing = useHandler((): void => {})

  const renderRow = useHandler((row: RecipientAssetRow) => {
    const { currencyCode, icon, name, network, value } = row

    return (
      <EdgeTouchableOpacity
        accessibilityRole="button"
        testID={`radioListItem_${value}`}
        onPress={() => {
          bridge.resolve(value)
        }}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.rowText}>
            <EdgeText>{name}</EdgeText>
            <EdgeText style={styles.network}>{network}</EdgeText>
          </View>
          <UnscaledText style={styles.currencyCode}>
            {currencyCode}
          </UnscaledText>
        </View>
      </EdgeTouchableOpacity>
    )
  })

  return (
    <ListModal
      bridge={bridge}
      title={title}
      label={searchPlaceholder}
      autoCorrect={false}
      autoCapitalize="none"
      rowsData={rows}
      rowComponent={renderRow}
      rowDataFilter={handleRowDataFilter}
      onSubmitEditing={handleSubmitEditing}
      fullScreen={false}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    margin: theme.rem(0.5)
  },
  iconContainer: {
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  rowText: {
    flexGrow: 1,
    flexShrink: 1
  },
  network: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  currencyCode: {
    color: theme.secondaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(0.75),
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(0.5),
    includeFontPadding: false
  }
}))
