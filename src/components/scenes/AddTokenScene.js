// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TextInput } from 'react-native'

import { addNewToken } from '../../actions/AddTokenActions'
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
  addTokenPending: boolean,
  currencyWallet: EdgeCurrencyWallet,
  currentCustomTokens?: CustomTokenInfo[],
  wallet: GuiWallet,
  onAddToken: (currencyCode: string) => void
}

type DispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, type: string) => void
}

type StateProps = {
  addTokenPending: boolean,
  currentCustomTokens: CustomTokenInfo[],
  wallet: GuiWallet,
  addTokenPending: boolean
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

export const AddToken = ({ addTokenPending, currentCustomTokens = [], wallet, walletId, currencyWallet, addNewToken, onAddToken }: Props) => {
  const styles = getStyles(useTheme())
  const [currencyCode, setCurrencyCode] = useState<string>('')
  const [currencyName, setCurrencyName] = useState<string>('')
  const [contractAddress, setContractAddress] = useState<string>('')
  const [decimalPlaces, setDecimalPlaces] = useState<string>('')

  const [isDecimalPlacesFocused, setIsDecimalPlacesFocused] = useState<boolean>(false)
  const scrollViewRef = useScrollToEnd(isDecimalPlacesFocused, KEYBOARD_ANIMATION_TIME) // Not the best solution for keyboard avoiding when bottom field focused

  const [currencyCodeReturnKeyType, setCurrencyCodeReturnKeyType] = useState<ReturnKeyType>('next')
  const [currencyNameReturnKeyType, setCurrencyNameReturnKeyType] = useState<ReturnKeyType>('next')
  const [contractAddressReturnKeyType, setContractAddressReturnKeyType] = useState<ReturnKeyType>('next')
  const [decimalPlacesReturnKeyType, setDecimalPlacesReturnKeyType] = useState<ReturnKeyType>('next')

  const currencyCodeInputRef = useRef<TextInput>()
  const currencyNameInputRef = useRef<TextInput>()
  const contractAddressInputRef = useRef<TextInput>()
  const decimalPlacesInputRef = useRef<TextInput>()

  const prevCurrencyCodeRef = useRef<string>('')

  useEffect(() => {
    prevCurrencyCodeRef.current = currencyCode
  })

  const prevCurrencyCode = prevCurrencyCodeRef.current

  const handleSubmit = async () => {
    try {
      await createValidation(wallet, currentCustomTokens, currencyWallet, {
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

  const autocompleteForm = async () => {
    if (currencyCode === prevCurrencyCode || currencyWallet.otherMethods.getTokenInfo == null) return

    const matchedToken = await currencyWallet.otherMethods.getTokenInfo(currencyCode)

    if (matchedToken == null) return

    const newDecimalPlaces = Math.floor(Math.log10(matchedToken.denominations[0].multiplier)).toString()

    setCurrencyName(matchedToken.currencyName)
    setDecimalPlaces(newDecimalPlaces)
    setContractAddress(matchedToken.contractAddress)
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
  }

  useReturnKeyType([currencyCode, currencyName, contractAddress, decimalPlaces], (returnKeyTypes: ReturnKeyType[]) => {
    setCurrencyCodeReturnKeyType(returnKeyTypes[0])
    setCurrencyNameReturnKeyType(returnKeyTypes[1])
    setContractAddressReturnKeyType(returnKeyTypes[2])
    setDecimalPlacesReturnKeyType(returnKeyTypes[3])
  })

  return (
    <SceneWrapper avoidKeyboard background="theme">
      <SceneHeader title={s.strings.title_add_token} style={styles.header} />
      <ScrollView style={[styles.container, styles.content]} ref={scrollViewRef} alwaysBounceVertical={false}>
        <EdgeTextFieldOutlined
          ref={currencyCodeInputRef}
          autoFocus
          onChangeText={setCurrencyCode}
          value={currencyCode}
          autoCapitalize="characters"
          returnKeyType={currencyCodeReturnKeyType}
          label={s.strings.addtoken_currency_code_input_text}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
          onBlur={autocompleteForm}
        />
        <EdgeTextFieldOutlined
          ref={currencyNameInputRef}
          onChangeText={setCurrencyName}
          value={currencyName}
          autoCapitalize="words"
          returnKeyType={currencyNameReturnKeyType}
          label={s.strings.addtoken_name_input_text}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={contractAddressInputRef}
          onChangeText={setContractAddress}
          value={contractAddress}
          returnKeyType={contractAddressReturnKeyType}
          label={s.strings.addtoken_contract_address_input_text}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={decimalPlacesInputRef}
          onFocus={() => setIsDecimalPlacesFocused(true)}
          onBlur={() => setIsDecimalPlacesFocused(false)}
          onChangeText={setDecimalPlaces}
          value={decimalPlaces}
          returnKeyType={decimalPlacesReturnKeyType}
          label={s.strings.addtoken_denomination_input_text}
          keyboardType="numeric"
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 0.5]}
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
    currentCustomTokens: state.ui.settings.customTokens,
    wallet: state.ui.wallets.byId[ownProps.walletId],
    currencyWallet: state.core.account.currencyWallets[ownProps.walletId]
  }),
  dispatch => ({
    addNewToken(walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) {
      dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
    }
  })
)(AddToken)
