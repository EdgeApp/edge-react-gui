import { FlashList } from '@shopify/flash-list'
import * as React from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { ImportKeyOption, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader'
import { WalletCreateItem } from '../themed/WalletList'
import { Tile } from '../tiles/Tile'

export interface CreateWalletImportOptionsParams {
  createWalletList: WalletCreateItem[]
  walletNames: { [key: string]: string }
  fiatCode: string
  importText: string
}

interface Props extends EdgeSceneProps<'createWalletImportOptions'> {}

const CreateWalletImportOptionsComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList, fiatCode, importText, walletNames } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const { currencyConfig } = account

  const importOpts = React.useMemo<Map<string, Set<ImportKeyOption>>>(() => {
    const pluginIdMap = new Map<string, Set<ImportKeyOption>>()

    for (const createItem of createWalletList) {
      const { pluginId, tokenId } = createItem
      const { importKeyOptions } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
      if (importKeyOptions == null || tokenId != null) continue

      if (!pluginIdMap.has(pluginId)) {
        pluginIdMap.set(pluginId, new Set(importKeyOptions))
      }
    }

    return pluginIdMap
  }, [createWalletList])

  const [values, setValues] = React.useState<Map<string, { value: string; error: boolean }>>(() => {
    const valueMap = new Map()
    for (const [pluginId, opts] of importOpts.entries()) {
      opts.forEach(opt => {
        valueMap.set(getOptionKey(pluginId, opt), { value: '', error: false })
      })
    }
    return valueMap
  })

  const disableNextButton = ![...importOpts.entries()].every(([pluginId, opts]) => {
    for (const opt of [...opts]) {
      const key = getOptionKey(pluginId, opt)
      const input = values.get(key)
      if (input == null) continue

      if (input.error || (input.value === '' && opt.required)) {
        return false
      }
    }

    return true
  })

  const handleValueChange = useHandler((input: string, pluginId: string, opt: ImportKeyOption) => {
    const key = getOptionKey(pluginId, opt)

    if (input === '' || opt.inputValidation(input)) {
      setValues(map => new Map(map.set(key, { value: input, error: false })))
    } else {
      setValues(map => new Map(map.set(key, { value: input, error: true })))
    }
  })

  const handleEditValue = async (initialValue: string, pluginId: string, opt: ImportKeyOption) => {
    const onSubmit = async (input: string) => {
      if (input === '') return true
      return await currencyConfig[pluginId]
        .importKey(importText, { keyOptions: { [opt.optionName]: input } })
        .then(() => true)
        .catch(e => {
          return String(e)
        })
    }

    let description: React.ReactNode | undefined
    if (opt.displayDescription != null) {
      const { message, knowledgeBaseUri } = opt.displayDescription

      if (knowledgeBaseUri != null) {
        const onPress = () => {
          Linking.openURL(knowledgeBaseUri).catch(err => showError(err))
        }
        description = (
          <ModalMessage>
            {message}
            <TouchableOpacity onPress={onPress}>
              <Ionicon name="help-circle-outline" size={theme.rem(1)} color={theme.iconTappable} />
            </TouchableOpacity>
          </ModalMessage>
        )
      } else {
        description = message
      }
    }

    await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={initialValue}
        inputLabel={opt.displayName}
        title={opt.displayName}
        message={description}
        keyboardType={opt.inputType}
        onSubmit={onSubmit}
      />
    )).then((response: string | undefined) => {
      if (response != null) {
        handleValueChange(response, pluginId, opt)
      }
    })
  }

  const renderOptions = useHandler((itemObj: FlatListItem<[string, Set<ImportKeyOption>]>) => {
    const [pluginId, opts] = itemObj.item
    const arr = [...opts.values()]

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionHeader}>
          <CryptoIcon sizeRem={1.25} pluginId={pluginId} />
          <EdgeText style={styles.pluginIdText}>{currencyConfig[pluginId].currencyInfo.displayName}</EdgeText>
        </View>
        {arr.map(opt => {
          const key = getOptionKey(pluginId, opt)
          const item = values.get(key)
          if (item == null) return null

          const { value, error } = item

          return (
            <View key={key} style={styles.optionInput}>
              <Tile
                type="editable"
                title={opt.displayName}
                maximumHeight="large"
                onPress={async () => await handleEditValue(value, pluginId, opt)}
                error={error || value === ''}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}
                >
                  <EdgeText>{value}</EdgeText>
                  <EdgeText
                    style={{
                      marginTop: theme.rem(0.25),
                      textAlign: 'right',
                      fontSize: theme.rem(0.75),
                      color: theme.deactivatedText
                    }}
                  >
                    {lstrings.fragment_required}
                  </EdgeText>
                </View>
              </Tile>
            </View>
          )
        })}
      </View>
    )
  })

  const handleNext = useHandler(async () => {
    const allKeyOptions = new Map<string, { [opt: string]: string | undefined }>()
    importOpts.forEach((opts, pluginId) => {
      const keyOptions: { [name: string]: string | undefined } = {}

      for (const opt of opts) {
        const value = values.get(getOptionKey(pluginId, opt))
        if (value == null) throw new Error('missing value')

        const input = value.value !== '' ? value.value : undefined
        keyOptions[opt.optionName] = input
      }

      allKeyOptions.set(pluginId, keyOptions)
    })
    navigation.navigate('createWalletCompletion', { createWalletList, walletNames, fiatCode, keyOptions: allKeyOptions, importText })
  })

  const keyExtractor = useHandler((item: [string, Set<ImportKeyOption>]) => item[0])

  return (
    <SceneWrapper background="theme">
      <SceneHeader title={lstrings.create_wallet_import_options_title} withTopMargin />
      <View style={styles.content}>
        <FlashList
          automaticallyAdjustContentInsets={false}
          data={[...importOpts.entries()]}
          estimatedItemSize={(importOpts.size * theme.rem(1.375) + values.size * theme.rem(4.25)) / (importOpts.size + values.size)}
          extraData={values}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          renderItem={renderOptions}
        />
        <MainButton
          disabled={disableNextButton}
          label={lstrings.string_next_capitalized}
          type="secondary"
          marginRem={[1, 1]}
          onPress={handleNext}
          alignSelf="center"
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flexGrow: 1
  },
  optionContainer: {
    marginTop: theme.rem(1)
  },
  optionHeader: {
    flexDirection: 'row',
    marginLeft: theme.rem(1)
  },
  pluginIdText: {
    fontSize: theme.rem(1),
    marginLeft: theme.rem(0.5)
  },
  optionInput: {
    marginLeft: theme.rem(1)
  }
}))

export const CreateWalletImportOptionsScene = React.memo(CreateWalletImportOptionsComponent)

const getOptionKey = (pluginId: string, opt: ImportKeyOption) => `${pluginId}${opt.optionName}`
