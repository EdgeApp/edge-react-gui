// @flow

import type { EdgeCurrencyWallet, EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TextInput } from 'react-native'

import { addNewToken } from '../../actions/AddTokenActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import { useScrollToEnd } from '../../hooks/behaviors/useScrollToEnd'
import s from '../../locales/strings.js'
import { useEffect, useRef, useState } from '../../types/reactHooks'
import { connect } from '../../types/reactRedux'
import type { CustomTokenInfo, GuiWallet } from '../../types/types'
import { createValidation, MISMATCH_ERROR } from '../../util/customToken'
import { decimalPlacesToDenomination } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { SceneHeader } from '../themed/SceneHeader'

export type OwnProps = {
  walletId: string,
  currentCustomTokens?: CustomTokenInfo[],
  metaToken?: EdgeMetaToken,
  onAddToken: (currencyCode: string) => void
}

type DispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, type: string) => void
}

type StateProps = {
  addTokenPending: boolean,
  currencyTokenInfos: any[], // TODO: replace it with real data when it will be available. Also need better variable name
  currencyWallet: EdgeCurrencyWallet,
  wallet: GuiWallet
}

type ReturnKeyType = 'next' | 'done'

type Props = OwnProps & StateProps & DispatchProps

const useReturnKeyType = (fieldsData: string[], updateCallback: (Array<'done' | 'next'>) => void) => {
  useEffect(() => {
    const returnKeyTypes: Array<'done' | 'next'> = []
    let dataEmptyIndex = -1
    let dataEmptyCount = 0

    for (let index = 0; index < fieldsData.length; index++) {
      if (fieldsData[index] === '') {
        dataEmptyCount += 1

        if (dataEmptyCount === 1) dataEmptyIndex = index
      }
    }

    for (let index = 0; index < fieldsData.length; index++) {
      returnKeyTypes[index] = dataEmptyCount === 0 || (index === dataEmptyIndex && dataEmptyCount === 1) ? 'done' : 'next'
    }

    updateCallback(returnKeyTypes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...fieldsData, updateCallback])
}

const KEYBOARD_ANIMATION_TIME = 300

export const uriValidation = async (currencyWallet: EdgeCurrencyWallet, obj: { [key: string]: string }): Promise<string> => {
  const tokenDefaults = getSpecialCurrencyInfo(currencyWallet.currencyInfo.currencyCode).customTokenParams
  if (tokenDefaults == null) return ''
  const { currencyCode, currencyName, contractAddress, multiplier } = { ...tokenDefaults, ...obj }
  const testUri = `${currencyWallet.currencyInfo.pluginId}:token-${contractAddress}?symbol=${currencyCode}&decimals=${multiplier}&name=${currencyName}`
  try {
    await currencyWallet.parseUri(testUri)
  } catch (e) {
    return e.message
  }
  return ''
}

export const AddToken = ({
  addTokenPending,
  currentCustomTokens = [],
  currencyTokenInfos,
  wallet,
  walletId,
  currencyWallet,
  addNewToken,
  metaToken,
  onAddToken
}: Props) => {
  const styles = getStyles(useTheme())
  const { currencyCode: metaTokenCurrencyCode = '', currencyName: metaTokenCurrencyName = '', contractAddress: metaTokenContractAddress = '' } = metaToken ?? {}
  const metaTokenDecimalPlaces = metaToken != null && metaToken.denominations[0] != null ? (metaToken.denominations[0].multiplier.length - 1).toString() : ''
  const [currencyCode, setCurrencyCode] = useState<string>(metaTokenCurrencyCode ?? '')
  const [currencyName, setCurrencyName] = useState<string>(metaTokenCurrencyName ?? '')
  const [contractAddress, setContractAddress] = useState<string>(metaTokenContractAddress ?? '')
  const [decimalPlaces, setDecimalPlaces] = useState<string>(metaTokenDecimalPlaces ?? '')

  console.log(';;', metaToken)

  const [isDecimalPlacesFocused, setIsDecimalPlacesFocused] = useState<boolean>(false)
  const scrollViewRef = useScrollToEnd(isDecimalPlacesFocused, KEYBOARD_ANIMATION_TIME) // Not the best solution for keyboard avoiding when bottom field focused

  const [currencyCodeError, setCurrencyCodeError] = useState<string>('')
  const [currencyNameError, setCurrencyNameError] = useState<string>('')
  const [contractAddressError, setContractAddressError] = useState<string>('')
  const [decimalPlacesError, setDecimalPlacesError] = useState<string>('')

  const [currencyCodeReturnKeyType, setCurrencyCodeReturnKeyType] = useState<ReturnKeyType>('next')
  const [currencyNameReturnKeyType, setCurrencyNameReturnKeyType] = useState<ReturnKeyType>('next')
  const [contractAddressReturnKeyType, setContractAddressReturnKeyType] = useState<ReturnKeyType>('next')
  const [decimalPlacesReturnKeyType, setDecimalPlacesReturnKeyType] = useState<ReturnKeyType>('next')

  const currencyCodeInputRef = useRef<TextInput>()
  const currencyNameInputRef = useRef<TextInput>()
  const contractAddressInputRef = useRef<TextInput>()
  const decimalPlacesInputRef = useRef<TextInput>()

  const handleSubmit = async () => {
    if (currencyCodeError !== '' || decimalPlacesError !== '' || currencyNameError !== '' || contractAddressError !== '') return

    try {
      await createValidation(wallet, currentCustomTokens, currencyTokenInfos, {
        currencyCode,
        currencyName,
        contractAddress,
        decimalPlaces
      })
    } catch (error) {
      if (error.message !== MISMATCH_ERROR) showError(error)
      return
    }

    const denomination = decimalPlacesToDenomination(decimalPlaces)

    addNewToken(walletId, currencyName, currencyCode.toUpperCase(), contractAddress, denomination, wallet.type)
    onAddToken(currencyCode.toUpperCase())
  }

  const autocompleteForm = () => {
    const currencyInfo = currencyTokenInfos.find(
      (item: any) =>
        item.currencyCode === currencyCode ||
        item.currencyName === currencyName ||
        item.decimalPlaces === decimalPlaces ||
        item.contractAddress === contractAddress
    )

    if (currencyInfo) {
      setCurrencyCode(currencyCode || currencyInfo.currencyCode)
      setCurrencyName(currencyName || currencyInfo.currencyName)
      setDecimalPlaces(decimalPlaces || currencyInfo.decimalPlaces)
      setContractAddress(contractAddress || currencyInfo.contractAddress)
    }
  }

  const getIsNextFieldFocused = (): boolean => {
    const data = [currencyCode, currencyName, contractAddress, decimalPlaces]
    const inputRefs = [currencyCodeInputRef, currencyNameInputRef, contractAddressInputRef, decimalPlacesInputRef]
    const dataEmptyIndex = data.findIndex(item => item === '')
    const isNextFieldFocused = dataEmptyIndex > -1

    if (isNextFieldFocused) {
      const nextFocusedField = inputRefs[dataEmptyIndex].current

      if (nextFocusedField !== null) nextFocusedField.focus()
    }

    return isNextFieldFocused
  }

  const handleSubmitEditing = () => {
    const isNextFieldFocused = getIsNextFieldFocused()

    if (!isNextFieldFocused) handleSubmit()

    autocompleteForm()
  }

  useReturnKeyType([currencyCode, currencyName, contractAddress, decimalPlaces], (returnKeyTypes: ReturnKeyType[]) => {
    setCurrencyCodeReturnKeyType(returnKeyTypes[0])
    setCurrencyNameReturnKeyType(returnKeyTypes[1])
    setContractAddressReturnKeyType(returnKeyTypes[2])
    setDecimalPlacesReturnKeyType(returnKeyTypes[3])
  })

  const handleChangeCurrencyCode = async (value: string) => {
    setCurrencyCode(value)
    setCurrencyCodeError(
      await uriValidation(currencyWallet, {
        currencyCode: value
      })
    )
  }

  const handleChangeCurrencyName = async (value: string) => {
    setCurrencyName(value)
    setCurrencyNameError(
      await uriValidation(currencyWallet, {
        currencyName: value
      })
    )
  }

  const handleChangeContractAddress = async (value: string) => {
    setContractAddress(value)
    setContractAddressError(
      await uriValidation(currencyWallet, {
        contractAddress: value
      })
    )
  }

  const handleChangeDecimalPlaces = async (value: string) => {
    setDecimalPlaces(value)
    setDecimalPlacesError(
      await uriValidation(currencyWallet, {
        multiplier: value
      })
    )
  }

  return (
    <SceneWrapper avoidKeyboard background="theme">
      <SceneHeader title={s.strings.title_add_token} style={styles.header} />
      <ScrollView style={[styles.container, styles.content]} ref={scrollViewRef} alwaysBounceVertical={false}>
        <EdgeTextFieldOutlined
          ref={currencyCodeInputRef}
          autoFocus
          onChangeText={handleChangeCurrencyCode}
          value={currencyCode}
          autoCapitalize="characters"
          returnKeyType={currencyCodeReturnKeyType}
          label={s.strings.addtoken_currency_code_input_text}
          error={currencyCodeError}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={currencyNameInputRef}
          onChangeText={handleChangeCurrencyName}
          value={currencyName}
          autoCapitalize="words"
          returnKeyType={currencyNameReturnKeyType}
          label={s.strings.addtoken_name_input_text}
          error={currencyNameError}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={contractAddressInputRef}
          onChangeText={handleChangeContractAddress}
          value={contractAddress}
          returnKeyType={contractAddressReturnKeyType}
          label={s.strings.addtoken_contract_address_input_text}
          error={contractAddressError}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={decimalPlacesInputRef}
          onFocus={() => setIsDecimalPlacesFocused(true)}
          onBlur={() => setIsDecimalPlacesFocused(false)}
          onChangeText={handleChangeDecimalPlaces}
          value={decimalPlaces}
          returnKeyType={decimalPlacesReturnKeyType}
          label={s.strings.addtoken_denomination_input_text}
          error={decimalPlacesError}
          keyboardType="numeric"
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.rem(1),
    overflow: 'hidden'
  },
  header: {
    marginBottom: 0
  }
}))

export const AddTokenScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    addTokenPending: state.ui.wallets.addTokenPending,
    wallet: state.ui.wallets.byId[ownProps.walletId],
    currencyWallet: state.core.account.currencyWallets[ownProps.walletId],
    currencyTokenInfos: [] // TODO: replace it with real data when it will be available
  }),
  dispatch => ({
    addNewToken(walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) {
      dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
    }
  })
)(AddToken)
