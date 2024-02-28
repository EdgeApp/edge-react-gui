import { JsonObject } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { PLACEHOLDER_WALLET_ID } from '../../actions/CreateWalletActions'
import ImportKeySvg from '../../assets/images/import-key-icon.svg'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { splitCreateWalletItems, WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput, FilledTextInputRef } from '../themed/FilledTextInput'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

export interface CreateWalletImportParams {
  createWalletList: WalletCreateItem[]
  walletNames: { [key: string]: string }
  fiatCode: string
}

interface Props extends EdgeSceneProps<'createWalletImport'> {}

const CreateWalletImportComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList, walletNames, fiatCode } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const { currencyConfig } = account

  const [importText, setImportText] = React.useState('')
  const [scrollEnabled, setScrollEnabled] = React.useState(false)

  const textInputRef = React.useRef<FilledTextInputRef>(null)

  const handleNext = useHandler(async () => {
    textInputRef.current?.blur()
    const cleanImportText = cleanupImportText(importText)

    // Test imports
    const { newWalletItems } = splitCreateWalletItems(createWalletList)

    const pluginIds = newWalletItems.map(item => item.pluginId)

    // Loop over plugin importPrivateKey
    const promises = pluginIds.map(
      async pluginId =>
        await currencyConfig[pluginId].importKey(cleanImportText).catch(e => {
          showError(e)
          console.warn('importKey failed', e)
        })
    )

    const results = await Promise.all(promises)

    const successMap: { [pluginId: string]: JsonObject } = {}

    for (const [i, keys] of results.entries()) {
      if (typeof keys === 'object') {
        // Success
        successMap[pluginIds[i]] = keys
      }
    }

    // Split up the original list of create items into success and failure lists
    const failureItems: WalletCreateItem[] = []
    const successItems: WalletCreateItem[] = []

    for (const item of createWalletList) {
      if (successMap[item.pluginId] != null) {
        // Any asset associated to this pluginId is good to go
        successItems.push(item)
      } else if (item.createWalletIds != null && item.createWalletIds[0] === PLACEHOLDER_WALLET_ID) {
        // Token items to be enabled on existing wallets and aren't dependent on a failed import are are good to go, too
        successItems.push(item)
      } else {
        // No good
        failureItems.push(item)
      }
    }

    if (successItems.length === 0) {
      await Airship.show<'edit' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={lstrings.create_wallet_all_failed}
          buttons={{
            edit: { label: lstrings.create_wallet_edit }
          }}
        />
      ))

      return
    }

    if (failureItems.length > 0) {
      // Show modal with errors
      const displayNames = failureItems.map(item => item.displayName).join(', ')
      const resolveValue = await Airship.show<'continue' | 'edit' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={sprintf(lstrings.create_wallet_some_failed, displayNames)}
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

    if (pluginIds.length > 0 && pluginIds.some(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.importKeyOptions != null)) {
      navigation.navigate('createWalletImportOptions', { createWalletList, walletNames, fiatCode, importText: cleanImportText })
      return
    }
    navigation.navigate('createWalletCompletion', { createWalletList, walletNames, fiatCode, importText: cleanImportText })
  })

  // Scale the icon
  const svgHeight = React.useMemo(() => 36 * theme.rem(0.0625), [theme])
  const svgWidth = React.useMemo(() => 83 * theme.rem(0.0625), [theme])

  return (
    <SceneWrapper>
      <SceneHeader title={lstrings.create_wallet_import_title} withTopMargin />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        onKeyboardDidChangeFrame={() => setScrollEnabled(false)}
        onKeyboardWillChangeFrame={() => setScrollEnabled(true)}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        <View style={styles.icon}>
          <ImportKeySvg accessibilityHint={lstrings.import_key_icon_hint} color={theme.iconTappable} height={svgHeight} width={svgWidth} />
        </View>
        <EdgeText style={styles.instructionalText} numberOfLines={2}>
          {lstrings.create_wallet_import_all_instructions}
        </EdgeText>
        <FilledTextInput
          top={1}
          horizontal={0.75}
          bottom={1.25}
          value={importText}
          returnKeyType="next"
          multiline
          placeholder={lstrings.create_wallet_import_input_key_or_seed_prompt}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setImportText}
          onSubmitEditing={handleNext}
          ref={textInputRef}
        />
        <MainButton label={lstrings.string_next_capitalized} type="secondary" marginRem={1} onPress={handleNext} />
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    marginTop: theme.rem(0.5)
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.rem(2)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1),
    marginHorizontal: theme.rem(0.5),
    textAlign: 'center'
  }
}))

export const CreateWalletImportScene = React.memo(CreateWalletImportComponent)

export const cleanupImportText = (importText: string) => {
  let cleanImportText = importText.trim()

  // Clean up mnemonic seeds
  const cleanImportTextArray = cleanImportText.split(' ')
  if (cleanImportTextArray.length > 1) {
    cleanImportText = cleanImportTextArray
      .filter(part => part !== '') // remove extra spaces
      .map(word => word.toLowerCase()) // normalize capitalization
      .join(' ')
  }
  return cleanImportText
}
