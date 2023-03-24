import { asNumber, asObject } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'
import { useSelector } from 'react-redux'

import { createCurrencyWallet } from '../../../actions/CreateWalletActions'
import { FIO_WALLET_TYPE } from '../../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { RootState } from '../../../reducers/RootReducer'
import { useDispatch } from '../../../types/reactRedux'
// import { getDefaultFiat } from '../../../selectors/SettingsSelectors'
import { NavigationProp } from '../../../types/routerTypes'
import { SceneWrapper } from '../../common/SceneWrapper'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { OutlinedTextInput } from '../../themed/OutlinedTextInput'

interface Props {
  navigation: NavigationProp<'fioCreateHandle'>
}

const asIsRegisteredRes = asObject({
  is_registered: asNumber
})

export const FioCreateHandleScene = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const defaultFiat = useSelector((state: RootState) => state.ui.settings.defaultIsoFiat)

  // HACK: Remove after fixing fio wallet creation
  const defaultFioWallet = useSelector((state: RootState) => state.ui.wallets.fioWallets[state.ui.wallets.fioWallets.length - 1])

  const [wallet, setWallet] = React.useState<EdgeCurrencyWallet | undefined>()
  const [fioHandle, setFioHandle] = React.useState('')
  const [errorText, setErrorText] = React.useState<string | undefined>(undefined)

  const handleRegisterPress = async () => {
    console.debug('Checking ' + fioHandle)
    try {
      const availRes = await fetch('https://fio.blockpane.com/v1/chain/avail_check', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fio_name: fioHandle
        })
      })
      const availCheckRes = asIsRegisteredRes(await availRes.json())

      if (availCheckRes.is_registered === 1) {
        setErrorText('Handle already taken')
      } else {
        console.debug('success')
        if (wallet != null) navigation.navigate('fioCreateHandleConfirmation', { fioHandle, wallet })
        else navigation.navigate('fioCreateHandleConfirmation', { fioHandle, wallet: defaultFioWallet })
      }
    } catch (e: any) {
      setErrorText(e.message)
    }
  }

  const handleCancelPress = () => {
    navigation.goBack()
  }

  React.useEffect(() => {
    // Clear error, if there was one
    setErrorText(undefined)
  }, [fioHandle])

  useAsyncEffect(async () => {
    // TODO: Fix
    // const wallet = await dispatch(createFioWallet())(dispatch, state)

    const wallet = await dispatch(createCurrencyWallet('s.strings.fio_address_register_default_fio_wallet_name', FIO_WALLET_TYPE, defaultFiat))

    // (dispatch,getState)
    // console.debug(wallet.name)
    // setWallet(wallet)
  }, [])

  return (
    <SceneWrapper background="header">
      <ScrollView contentContainerStyle={styles.container}>
        <FastImage source={{ uri: 'https://content.edge.app/currencyIconsV3/fio/fio_dark.png' }} style={styles.icon} />
        <EdgeText style={styles.title}>Personalize Your Wallet</EdgeText>
        <View style={styles.inputContainer}>
          <OutlinedTextInput
            error={errorText}
            value={fioHandle}
            onChangeText={setFioHandle}
            // TODO: end placeholder="@edge"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.buttonContainer}>
          <MainButton type="secondary" label="Cancel" onPress={handleCancelPress} marginRem={1} />
          <MainButton type="primary" label="Register Handle" onPress={handleRegisterPress} marginRem={1} disabled={fioHandle === '' || errorText != null} />
        </View>
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    paddingVertical: theme.rem(3)
  },
  icon: {
    width: theme.rem(10),
    height: theme.rem(10),
    marginBottom: theme.rem(0.5)
  },
  title: {
    fontSize: theme.rem(1.75),
    marginBottom: theme.rem(1),
    textAlign: 'center'
  },
  inputContainer: {
    width: '75%'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.rem(2),
    marginTop: theme.rem(1)
  }
}))
