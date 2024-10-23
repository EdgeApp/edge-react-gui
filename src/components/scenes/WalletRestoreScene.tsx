import { EdgeWalletInfoFull, EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import { FlatList, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { toLocaleDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { findCurrencyInfo } from '../../util/CurrencyInfoHelpers'
import { logActivity } from '../../util/logger'
import { normalizeForSearch } from '../../util/utils'
import { SCENE_BUTTONS_MARGIN_REM, SceneButtons } from '../buttons/SceneButtons'
import { WalletRestoreCard } from '../cards/WalletRestoreCard'
import { EdgeAnim, fadeInLeft, fadeInRight, fadeOut } from '../common/EdgeAnim'
import { InsetStyle, SceneWrapper } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'

interface Props extends EdgeAppSceneProps<'walletRestore'> {}

export function WalletRestoreScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const allKeys = useWatch(account, 'allKeys')
  const restoreWalletInfos = allKeys
    .filter(key => key.archived || key.deleted)
    .sort((a, b) => {
      const aDate = a.created?.valueOf() ?? 0
      const bDate = b.created?.valueOf() ?? 0
      return aDate - bDate
    })

  const [searchText, setSearchText] = React.useState('')
  const [selectedWalletInfos, setSelectedWalletInfos] = React.useState<EdgeWalletInfoFull[]>([])

  const handlePressDone = useHandler(async () => {
    const response = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.restore_wallets_modal_title}
        message={lstrings.restore_wallets_modal_body}
        buttons={{
          confirm: { label: lstrings.restore_wallets_modal_confirm },
          cancel: { label: lstrings.restore_wallets_modal_cancel }
        }}
      />
    ))
    if (response === 'confirm') {
      const states: EdgeWalletStates = {}
      for (const info of selectedWalletInfos) {
        states[info.id] = { archived: false, deleted: false }
      }
      await account.changeWalletStates(states)
      logActivity(`Restore Wallets: ${account.username}`)

      navigation.navigate('edgeTabs', { screen: 'walletsTab', params: { screen: 'walletList' } })
    }
  })

  const handleSearchClear = useHandler(() => {
    setSearchText('')
  })

  const handleSelectionChanged = useHandler((walletInfo: EdgeWalletInfoFull, isSelected: boolean) => {
    if (isSelected) {
      setSelectedWalletInfos([...selectedWalletInfos, walletInfo])
    } else {
      setSelectedWalletInfos(selectedWalletInfos.filter(selectedWalletInfo => selectedWalletInfo.id !== walletInfo.id))
    }
  })

  return (
    <SceneWrapper avoidKeyboard>
      {({ insetStyle }) => (
        <View style={styles.container}>
          <SceneHeaderUi4 title={lstrings.restore_wallets_modal_title} />
          <SimpleTextInput
            horizontalRem={0.5}
            bottomRem={0.5}
            returnKeyType="search"
            placeholder={lstrings.search_wallets}
            onChangeText={setSearchText}
            onClear={handleSearchClear}
            value={searchText}
            iconComponent={SearchIconAnimated}
          />
          <RestoreList insetStyle={insetStyle} restoreWalletInfos={restoreWalletInfos} searchText={searchText} onSelectionChanged={handleSelectionChanged} />
          <SceneButtons
            primary={{
              label: lstrings.restore,
              onPress: handlePressDone,
              disabled: selectedWalletInfos.length === 0
            }}
            absolute
          />
        </View>
      )}
    </SceneWrapper>
  )
}

const RestoreList = (props: {
  insetStyle: InsetStyle
  restoreWalletInfos: EdgeWalletInfoFull[]
  searchText: string
  onSelectionChanged: (walletInfo: EdgeWalletInfoFull, isSelected: boolean) => void
}) => {
  const { insetStyle, restoreWalletInfos, searchText, onSelectionChanged } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const filteredWalletInfos = React.useMemo(() => {
    const searchTarget = normalizeForSearch(searchText)

    const out: Array<EdgeWalletInfoFull | string> = []
    let lastSection = ''
    for (const restoreWalletInfo of restoreWalletInfos) {
      const { type, created } = restoreWalletInfo
      const currencyInfo = findCurrencyInfo(account, type)
      if (currencyInfo == null) continue

      const { currencyCode, displayName } = currencyInfo

      if (searchTarget.trim() === '' || normalizeForSearch(currencyCode).includes(searchTarget) || normalizeForSearch(displayName).includes(searchTarget)) {
        // TODO: Potentially add oldest recorded date cutoff to `older_date` case
        const dateSectionHeader = created == null ? lstrings.older_date : toLocaleDate(created)
        if (dateSectionHeader !== lastSection) {
          out.push(dateSectionHeader)
          lastSection = dateSectionHeader
        }

        out.push(restoreWalletInfo)
      }
    }

    return out
  }, [account, restoreWalletInfos, searchText])

  const contentContainerStyle = React.useMemo(
    () => ({
      paddingTop: theme.rem(0.5),
      paddingBottom: insetStyle.paddingBottom + theme.rem(SCENE_BUTTONS_MARGIN_REM)
    }),
    [insetStyle.paddingBottom, theme]
  )

  const keyExtractor = (item: EdgeWalletInfoFull | string): string => {
    if (item == null) return ''
    if (typeof item === 'string') return item
    return item.id
  }

  const renderRow = React.useCallback(
    (item: FlatListItem<EdgeWalletInfoFull | string>) => {
      if (item.item == null) return <></>
      if (typeof item.item === 'string')
        return (
          <EdgeAnim enter={fadeInLeft}>
            <WalletListSectionHeader title={item.item} />
          </EdgeAnim>
        )

      const walletInfo: EdgeWalletInfoFull = item.item
      return (
        <EdgeAnim enter={fadeInRight} exit={fadeOut}>
          <WalletRestoreCard
            walletInfo={item.item}
            onPress={isSelected => {
              onSelectionChanged(walletInfo, isSelected)
            }}
          />
        </EdgeAnim>
      )
    },
    [onSelectionChanged]
  )

  return (
    <FlatList
      style={styles.listContainer}
      contentContainerStyle={contentContainerStyle}
      data={filteredWalletInfos}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      renderItem={renderRow}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5),
    paddingBottom: 0,
    flexShrink: 1,
    flexGrow: 1
  },
  listContainer: {
    marginHorizontal: -theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5)
  }
}))
