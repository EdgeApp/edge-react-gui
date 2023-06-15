import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { createWallet, enableTokensAcrossWallets, getUniqueWalletName, splitCreateWalletItems } from '../../actions/CreateWalletActions'
import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { GuiFiatType } from '../../types/types'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FiatListModal } from '../modals/FiatListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'
import { WalletCreateItem } from '../themed/WalletList'

export interface CreateWalletSelectFiatParams {
  createWalletList: WalletCreateItem[]
}

interface Props extends EdgeSceneProps<'createWalletSelectFiat'> {}

const CreateWalletSelectFiatComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const [fiat, setFiat] = React.useState(() => getSupportedFiats(defaultFiat)[0])

  const { newWalletItems, newTokenItems } = React.useMemo(() => splitCreateWalletItems(createWalletList), [createWalletList])

  const [walletNames, setWalletNames] = React.useState(() =>
    createWalletList.reduce<{ [key: string]: string }>((map, item) => {
      map[item.key] = getUniqueWalletName(account, item.pluginId)
      return map
    }, {})
  )

  const handleEditWalletName = useHandler(async (key: string, currentName: string) => {
    const newName = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCorrect={false}
        bridge={bridge}
        initialValue={currentName}
        inputLabel={lstrings.fragment_wallets_rename_wallet}
        returnKeyType="go"
        title={lstrings.fragment_wallets_rename_wallet}
      />
    ))
    if (newName != null) setWalletNames({ ...walletNames, [key]: newName })
  })

  const handleCreate = useHandler(async () => {
    // If only creating one wallet, do it now and return to home screen
    if (newWalletItems.length === 1 && newTokenItems.length === 0) {
      const item = newWalletItems[0]
      try {
        await createWallet(account, { walletType: item.walletType, walletName: walletNames[item.key], fiatCurrencyCode: `iso:${fiat.value}` })
        logEvent('Create_Wallet_Success')
      } catch (error: any) {
        showError(error)
        logEvent('Create_Wallet_Failed', { error: String(error) })
      }
      navigation.navigate('walletsTab', { screen: 'walletList' })
      return
    }
    // Any other combination goes to the completion scene
    navigation.navigate('createWalletCompletion', { createWalletList, walletNames, fiatCode: fiat.value })
  })

  const handleImport = useHandler(async () => {
    // Create copy that we can mutate
    const newWalletItemsCopy = [...newWalletItems]

    // Remove items that cannot be imported
    const importNotSupportedItems: WalletCreateItem[] = []
    for (let i = newWalletItemsCopy.length - 1; i >= 0; i--) {
      const { isImportKeySupported = false } = SPECIAL_CURRENCY_INFO[newWalletItemsCopy[i].pluginId] ?? {}
      if (!isImportKeySupported) {
        const removedItem = newWalletItemsCopy.splice(i, 1)
        importNotSupportedItems.push(removedItem[0])
      }
    }

    // Check if any remaining selected assets can be imported
    if (newWalletItemsCopy.length === 0 && newTokenItems.length === 0) {
      await Airship.show<'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={lstrings.create_wallet_all_disabled_import}
          buttons={{
            cancel: { label: lstrings.string_cancel_cap }
          }}
        />
      ))

      return
    }

    // If items remain that can be imported/enabled, show a warning that some assets will cannot be imported
    if (importNotSupportedItems.length > 0) {
      const displayNames = importNotSupportedItems.map(item => item.displayName).join(', ')
      const resolveValue = await Airship.show<'continue' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={sprintf(lstrings.create_wallet_some_disabled_import, displayNames)}
          buttons={{
            continue: { label: lstrings.legacy_address_modal_continue },
            cancel: { label: lstrings.string_cancel_cap }
          }}
        />
      ))

      if (resolveValue === 'cancel' || resolveValue == null) {
        return
      }
    }

    // If all remaining create items are tokens just go enable them and return home
    if (newWalletItemsCopy.length === 0 && newTokenItems.length > 0) {
      await dispatch(enableTokensAcrossWallets(newTokenItems))
      navigation.navigate('walletsTab', { screen: 'walletList' })
      return
    }

    navigation.navigate('createWalletImport', { createWalletList: [...newWalletItemsCopy, ...newTokenItems], walletNames, fiatCode: fiat.value })
  })

  const renderSelectedFiatRow = useHandler(() => {
    const fiatCountry = FIAT_COUNTRY[fiat.value]

    const key = `currency_label_${fiat.value}`
    const subTitle = lstrings[key as keyof typeof lstrings] ?? lstrings.currency_label_

    return (
      <SelectableRow
        icon={fiatCountry.logoUrl ? <FastImage source={{ uri: fiatCountry.logoUrl }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        paddingRem={[0, 1]}
        subTitle={subTitle}
        title={fiat.value}
        onPress={renderSelectFiatTypeModal}
      />
    )
  })

  const renderSelectFiatTypeModal = useHandler(async () => {
    const fiat = await Airship.show<GuiFiatType>(bridge => <FiatListModal bridge={bridge} />)
    if (fiat != null) setFiat(fiat)
  })

  const renderCurrencyRow: ListRenderItem<WalletCreateItem> = useHandler(data => {
    const { key, pluginId, tokenId, walletType, createWalletIds } = data.item

    if (walletType != null) {
      // New mainchain wallet
      const walletName = walletNames[key]
      const chevron = <IonIcon size={theme.rem(1.5)} color={theme.iconTappable} name="chevron-forward-outline" />

      return (
        <CreateWalletSelectCryptoRow
          pluginId={pluginId}
          walletName={walletName}
          onPress={async () => await handleEditWalletName(key, walletName)}
          rightSide={chevron}
        />
      )
    } else if (createWalletIds != null && createWalletIds.length === 1 && createWalletIds[0] !== 'NEW_WALLET_UNIQUE_STRING') {
      // Token added to existing wallet
      const walletName = getWalletName(currencyWallets[createWalletIds[0]])

      return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} />
    } else {
      // Token added to new wallet
      const newWalletItem = createWalletList.find(item => item.pluginId === pluginId && item.walletType != null)
      if (newWalletItem == null) return null
      const walletName = walletNames[newWalletItem.key]

      return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} />
    }
  })

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  return (
    <SceneWrapper background="theme">
      <SceneHeader title={lstrings.title_create_wallet} withTopMargin />
      <View style={styles.content}>
        {renderSelectedFiatRow()}
        <EdgeText style={styles.instructionalText} numberOfLines={1}>
          {lstrings.fragment_create_wallet_instructions}
        </EdgeText>
        <FlashList
          automaticallyAdjustContentInsets={false}
          data={createWalletList}
          estimatedItemSize={theme.rem(4.25)}
          extraData={walletNames}
          keyExtractor={keyExtractor}
          renderItem={renderCurrencyRow}
        />
        <MainButton label={lstrings.title_create_wallets} type="secondary" marginRem={[0.5, 0.5, 0]} onPress={handleCreate} alignSelf="center" />
        <MainButton label={lstrings.create_wallet_imports_title} type="escape" marginRem={[0.5, 0.5, 1]} onPress={handleImport} alignSelf="center" />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1,
    paddingTop: theme.rem(0.5)
  },
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25),
    backgroundColor: theme.backgroundGradientColors[1]
  },
  instructionalText: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    paddingBottom: theme.rem(0.5),
    paddingHorizontal: theme.rem(1),
    textAlign: 'left'
  }
}))

export const CreateWalletSelectFiatScene = React.memo(CreateWalletSelectFiatComponent)
