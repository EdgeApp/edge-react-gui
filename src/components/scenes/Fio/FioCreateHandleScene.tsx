import { asNumber, asObject, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TextInput, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { createFioWallet, refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { FIO_ADDRESS_DELIMITER } from '../../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getFioCustomizeHandleImage } from '../../../util/CdnUris'
import { SceneWrapper } from '../../common/SceneWrapper'
import { showError, showToast } from '../../services/AirshipInstance'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { OutlinedTextInput } from '../../themed/OutlinedTextInput'

export interface FioCreateHandleParams {
  freeRegApiToken: string
  freeRegRefCode: string
}

interface Props extends EdgeSceneProps<'fioCreateHandle'> {}

const asRegisterSuccessRes = asObject({
  account_id: asNumber,
  error: asValue(false)
})

const asRegisterFailedRes = asObject({
  success: asValue(false),
  error: asString
})

const asFreeFioDomain = asObject({
  domain: asString,
  free: asValue(true)
})

export const FioCreateHandleScene = (props: Props) => {
  const { navigation, route } = props
  const { freeRegApiToken, freeRegRefCode } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const fioPlugin = useSelector(state => state.core.account.currencyConfig.fio)
  if (fioPlugin.otherMethods == null) {
    showError(lstrings.fio_register_handle_error)
    navigation.pop()
  }

  const [wallet, setWallet] = React.useState<EdgeCurrencyWallet | undefined>()
  const [domainStr, setDomainStr] = React.useState<string>('')
  const [fioHandle, setFioHandle] = React.useState<string>('')
  const [errorText, setErrorText] = React.useState<string>()

  const inputRef = React.useRef<TextInput>(null)
  const mounted = React.useRef<boolean>(true)

  // TODO: Give feedback to the user to indicate why the input was rejected
  const handleChangeFioHandle = useHandler((userInput: string) => {
    // Dash '-' allowed,
    // but cannot be the first...
    if (userInput.indexOf('-') === 0) {
      userInput = userInput.slice(1) // remove first character
    }

    // ... or the last character
    if (userInput.includes('-', userInput.length - 1)) {
      userInput = userInput.slice(0, -1) // remove last character
    }

    // ASCII a-z 0-9. Remove all non-alphanumeric characters, convert to
    // lowercase. Allow dashes as they were cleaned above
    userInput = userInput.replace(/[^a-z0-9-]/gi, '').toLowerCase()

    setFioHandle(userInput)
  })

  const handleRegisterPress = async () => {
    // Register button is disabled if wallet ctreation isn't finished yet.
    // Shouldn't happen.
    if (wallet == null) return
    await account.waitForCurrencyWallet(wallet.id)

    // Check if the handle is already registered
    const fioAccountName = `${fioHandle}${domainStr}`
    if (!(await fioPlugin.otherMethods.validateAccount(fioAccountName))) {
      if (!mounted.current) return
      setErrorText(sprintf(lstrings.fio_register_handle_taken_error_s, fioAccountName))
    }

    // Register handle
    try {
      // TODO: Refactor fioPlugin.otherMethods.buyAddressRequest to support
      // handling custom referralCode and apiToken
      const regAddressRes = await fetch('https://reg.fioprotocol.io/public-api/buy-address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: fioAccountName,
          referralCode: freeRegRefCode,
          publicKey: (await wallet.getReceiveAddress()).publicAddress,
          redirectUrl: '',
          apiToken: freeRegApiToken
        })
      }).then(async res => await res.json())

      // Check registration status
      try {
        asRegisterSuccessRes(regAddressRes)

        await dispatch(refreshAllFioAddresses())
        showToast(lstrings.fio_free_handle_complete)
        navigation.pop()
      } catch (e: any) {
        // Rejected somehow, see if error is readable
        const failedRes = asRegisterFailedRes(regAddressRes)
        if (!mounted.current) return
        setErrorText(failedRes.error)
      }
    } catch (e: any) {
      // Registration fetch failed
      console.error(JSON.stringify(e, null, 2))
      if (!mounted.current) return
      setErrorText(lstrings.fio_register_handle_error)
    }
  }

  const handleCancelPress = useHandler(() => {
    navigation.goBack()
  })

  // Create the new FIO wallet, default the handle to a cleaned version of the username
  useAsyncEffect(async () => {
    const domains = await fioPlugin.otherMethods.getDomains(freeRegRefCode)
    if (domains.length === 1) {
      if (!mounted.current) return
      try {
        setDomainStr(`${FIO_ADDRESS_DELIMITER}${asFreeFioDomain(domains[0]).domain}`)
      } catch (e) {
        setErrorText(lstrings.fio_register_handle_error)
        return
      }
    }
    handleChangeFioHandle(account.username ?? '')

    const wallet = await dispatch(createFioWallet())

    if (!mounted.current) return
    setWallet(wallet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // Clear error, if there was one
    setErrorText(undefined)
  }, [fioHandle])

  React.useEffect(() => {
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FastImage source={{ uri: getFioCustomizeHandleImage(theme) }} style={styles.icon} />
        <EdgeText style={styles.title}>{lstrings.personalize_wallet_title}</EdgeText>
        <View style={styles.inputContainer}>
          <OutlinedTextInput
            ref={inputRef}
            suffix={domainStr}
            value={domainStr === '' ? '' : fioHandle}
            onChangeText={handleChangeFioHandle}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={64 - domainStr.length}
            showSpinner={domainStr === ''}
          />
          <EdgeText style={styles.errorText} numberOfLines={5}>
            {errorText ?? ''}
          </EdgeText>
        </View>
        <View style={styles.buttonContainer}>
          <MainButton
            type="primary"
            label={lstrings.fio_register_handle_button}
            onPress={handleRegisterPress}
            marginRem={0.5}
            disabled={fioHandle.length < 3 || errorText != null || wallet == null}
          />
          <MainButton type="escape" label={lstrings.string_cancel_cap} onPress={handleCancelPress} marginRem={0.5} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonContainer: {
    width: '100%',
    flex: 1,
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    marginBottom: theme.rem(2),
    paddingHorizontal: theme.rem(1)
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.rem(1)
  },
  errorText: {
    fontSize: theme.rem(0.75),
    color: theme.dangerText
  },
  icon: {
    width: theme.rem(10),
    height: theme.rem(10),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5)
  },
  title: {
    fontSize: theme.rem(1.75),
    marginBottom: theme.rem(1),
    textAlign: 'center'
  },
  inputContainer: {
    width: '75%',
    marginTop: theme.rem(1)
  }
}))
