import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { createFioWallet } from '../../../actions/FioAddressActions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp } from '../../../types/routerTypes'
import { SceneWrapper } from '../../common/SceneWrapper'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { OutlinedTextInput } from '../../themed/OutlinedTextInput'

interface Props {
  navigation: NavigationProp<'fioCreateHandle'>
}

export const FioCreateHandleScene = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const accountUserName = useSelector(state => state.core.account.username)
  const domainStr = `@${config.appName.toLowerCase()}`

  const [wallet, setWallet] = React.useState<EdgeCurrencyWallet | undefined>()
  const [fioHandle, setFioHandle] = React.useState<string>('')
  const [errorText, setErrorText] = React.useState<string>()
  const inputRef = React.useRef<TextInput>(null)

  const handleChangeFioHandle = useHandler((userInput: string) => {
    // Clean the userInput:
    userInput = userInput.replace(domainStr, '').trim()

    // ASCII a-z 0-9. Remove all non-alphanumeric characters, convert to
    // lowercase
    userInput = userInput.replace(/[^a-z0-9]/gi, '').toLowerCase()

    // Dash '-' allowed, but cannot be first or last character
    if (userInput.length > 1) {
      userInput = userInput.charAt(0) + userInput.slice(1, -1).replace('-', '') + userInput.slice(-1)
    } else if (userInput === '-') {
      userInput = ''
    }

    setFioHandle(`${userInput}`)
  })

  const handleRegisterPress = async () => {
    // Register button is disabled if wallet creation isn't finished yet
    if (wallet == null) return

    // TODO: Check if fioHandle is already registered, create the handle.
    setErrorText('TODO')
  }

  // Ensure that focus puts the cursor after the handle, but before the domain
  const handleInputFocus = useHandler(() => {
    setErrorText(undefined)
    if (inputRef.current != null) {
      inputRef.current.focus()
      inputRef.current.setNativeProps({ selection: { start: fioHandle.length, end: fioHandle.length } })
    }
  })

  const handleInputBlur = useHandler(() => {
    if (inputRef.current != null) {
      inputRef.current.blur()
    }
  })

  const handleInputClear = useHandler(() => {
    // TODO: BUG: Clearing the field twice consecutively will clear the domain.
    setFioHandle('')
  })

  // Ensure the cursor cannot be moved beyond the handle portion of the input
  const handleSelectionChange = useHandler((event: any) => {
    const start = event.nativeEvent.selection.start
    // Check if the cursor is within the handle name and before the domain
    if (start > fioHandle.length) {
      // Move the cursor back to the end of the handle name
      inputRef.current && inputRef.current.setNativeProps({ selection: { start: fioHandle.length, end: fioHandle.length } })
    }
  })

  const handleCancelPress = useHandler(() => {
    navigation.goBack()
  })

  // Create the new FIO wallet, default the handle to a cleaned version of the username
  useAsyncEffect(async () => {
    const wallet = await dispatch(createFioWallet())
    setWallet(wallet)

    handleChangeFioHandle(accountUserName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  React.useEffect(() => {
    // Clear error, if there was one
    setErrorText(undefined)
  }, [fioHandle])

  return (
    <SceneWrapper background="theme">
      <ScrollView contentContainerStyle={styles.container}>
        <FastImage source={{ uri: 'https://content.edge.app/currencyIconsV3/fio/fio_dark.png' }} style={styles.icon} />
        <EdgeText style={styles.title}>{s.strings.personalize_wallet_title}</EdgeText>
        <View style={styles.inputContainer}>
          <OutlinedTextInput
            ref={inputRef}
            error={errorText}
            value={`${fioHandle} ${domainStr}`}
            onChangeText={handleChangeFioHandle}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClear={handleInputClear}
            onSelectionChange={handleSelectionChange}
            // Actual limit is 64 total, but we added an extra space between domain and handle for prettiness
            maxLength={65}
          />
        </View>
        <View style={styles.buttonContainer}>
          <MainButton type="secondary" label={s.strings.string_cancel_cap} onPress={handleCancelPress} marginRem={0.5} />
          <MainButton
            type="primary"
            label={s.strings.fio_register_handle_button}
            onPress={handleRegisterPress}
            marginRem={0.5}
            disabled={fioHandle.length < 3 || errorText != null || wallet == null}
          />
        </View>
      </ScrollView>
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
