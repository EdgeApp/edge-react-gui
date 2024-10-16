import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useMount } from '../../hooks/useMount'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { Paragraph } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { MainButton } from '../themed/MainButton'

export interface CreateWalletAccountSetupParams {
  accountHandle?: string
  isReactivation?: boolean
  walletId: string
}

interface Props extends EdgeAppSceneProps<'createWalletAccountSetup'> {
  wallet: EdgeCurrencyWallet
}

/**
 * Allows the user to choose an EOS handle.
 */
export const CreateWalletAccountSetupScene = withWallet((props: Props) => {
  const { navigation, route, wallet: existingWallet } = props
  const { accountHandle: initialValue = '' } = route.params
  const { currencyCode: existingCurrencyCode, pluginId: existingPluginId } = existingWallet.currencyInfo

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>()
  const [spinning, setSpinning] = React.useState(false)
  const [text, setText] = React.useState(initialValue)

  const handleChangeText = (text: string) => {
    setText(text)
    setErrorMessage(undefined)
  }

  async function checkHandle() {
    const currencyPlugin = account.currencyConfig[existingPluginId]
    const data = await currencyPlugin.otherMethods.validateAccount(text)
    if (data.result === 'AccountAvailable') {
      navigation.navigate('createWalletAccountSelect', {
        accountName: text,
        walletId: existingWallet.id
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

  const trackWalletActivate = useHandler(() => {
    dispatch(logEvent('Activate_Wallet_Start'))
  })

  useMount(trackWalletActivate)

  return (
    <SceneWrapper scroll>
      <View style={{ alignSelf: 'center' }}>
        <CryptoIcon marginRem={1} pluginId={existingPluginId} sizeRem={4} tokenId={null} />
      </View>
      {/* This is an abuse of ModalMessage,
      but EdgeText breaks this text by setting numberOfLines.
      Switch to MessageText if we ever define that: */}
      <Paragraph>{sprintf(lstrings.create_wallet_account_review_instructions, existingCurrencyCode)}</Paragraph>
      <Paragraph>{lstrings.create_wallet_account_requirements_eos}</Paragraph>
      <FilledTextInput
        aroundRem={1}
        bottomRem={2}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
        error={errorMessage}
        placeholder={lstrings.create_wallet_account_handle}
        maxLength={12}
        returnKeyType="next"
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
      />
      <MainButton
        disabled={spinning || text.length !== 12}
        label={spinning ? undefined : lstrings.string_next_capitalized}
        marginRem={1}
        spinner={spinning}
        type="primary"
        onPress={handleSubmit}
      />
    </SceneWrapper>
  )
})
