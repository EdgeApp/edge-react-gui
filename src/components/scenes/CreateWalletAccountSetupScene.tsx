import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { useMount } from '../../hooks/useMount'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface Props extends EdgeSceneProps<'createWalletAccountSetup'> {}

/**
 * Allows the user to choose an EOS handle.
 */
export function CreateWalletAccountSetupScene(props: Props): JSX.Element {
  const { navigation, route } = props
  const { accountHandle: initialValue = '', existingWalletId, selectedWalletType } = route.params
  const { currencyCode, pluginId } = selectedWalletType

  const account = useSelector(state => state.core.account)
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>()
  const [spinning, setSpinning] = React.useState(false)
  const [text, setText] = React.useState(initialValue)

  const handleChangeText = (text: string) => {
    setText(text)
    setErrorMessage(undefined)
  }

  async function checkHandle() {
    const currencyPlugin = account.currencyConfig[pluginId]
    const data = await currencyPlugin.otherMethods.validateAccount(text)
    if (data.result === 'AccountAvailable') {
      navigation.navigate('createWalletAccountSelect', {
        selectedWalletType,
        accountName: text,
        existingWalletId
      })
    }
  }

  const handleSubmit = () => {
    setSpinning(true)
    checkHandle()
      .catch(error => {
        console.log('checkHandleAvailability error: ', error)
        if (error.name === 'ErrorAccountUnavailable') {
          setErrorMessage(lstrings.create_wallet_account_account_name_unavailable)
        } else if (error.name === 'ErrorInvalidAccountName') {
          setErrorMessage(lstrings.create_wallet_account_invalid_account_name)
        } else {
          setErrorMessage(lstrings.create_wallet_account_unknown_error)
        }
      })
      .finally(() => setSpinning(false))
  }

  const tokenId = getTokenId(account, pluginId, currencyCode)

  useMount(() => logEvent('Activate_Wallet_Start'))

  return (
    <SceneWrapper scroll>
      <View style={{ alignSelf: 'center' }}>
        <CryptoIcon marginRem={1} pluginId={pluginId} sizeRem={4} tokenId={tokenId} />
      </View>
      {/* This is an abuse of ModalMessage,
      but EdgeText breaks this text by setting numberOfLines.
      Switch to MessageText if we ever define that: */}
      <ModalMessage>{sprintf(lstrings.create_wallet_account_review_instructions, currencyCode)}</ModalMessage>
      <ModalMessage>{lstrings.create_wallet_account_requirements_eos}</ModalMessage>
      <OutlinedTextInput
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
        error={errorMessage}
        label={lstrings.create_wallet_account_handle}
        marginRem={[1, 1, 2]}
        maxLength={12}
        returnKeyType="next"
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
      />
      <MainButton
        alignSelf="center"
        disabled={spinning || text.length !== 12}
        label={spinning ? undefined : lstrings.string_next_capitalized}
        marginRem={0.5}
        spinner={spinning}
        type="primary"
        onPress={handleSubmit}
      />
    </SceneWrapper>
  )
}
