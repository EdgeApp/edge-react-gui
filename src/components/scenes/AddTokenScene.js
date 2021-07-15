// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TextInput } from 'react-native'

import { addNewToken } from '../../actions/AddTokenActions'
import { MAX_TOKEN_CODE_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux'
import type { CustomTokenInfo, GuiWallet } from '../../types/types'
import { useEffect, useRef, useState } from '../../types/reactHooks'
import { decimalPlacesToDenomination } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { MismatchTokenParamsModal } from '../modals/MismatchTokenParamsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { SceneHeader } from '../themed/SceneHeader'

export type OwnProps = {
  walletId: string,
  addTokenPending: boolean,
  currencyWallet: EdgeCurrencyWallet,
  currentCustomTokens?: CustomTokenInfo[],
  currencyInfos: any[], // TODO: replace it with real data when it will be available. Also need better variable name
  wallet: GuiWallet,
  onAddToken: (currencyCode: string) => void
}

type DispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, type: string) => void
}

type StateProps = {
  addTokenPending: boolean,
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

const CURRENCY_NAME_MAX_LENGTH = 12
const CONTRACT_ADDRESS_MAX_LENGTH = 30
const DECIMAL_PLACES_MAX_LENGTH = 1

const currencyCodeValidation = (value: string): string => (/[^a-z\d]/i.test(value) ? s.strings.warning_alphanumeric : '')

export const AddToken = ({ addTokenPending, currentCustomTokens = [], currencyInfos, wallet, walletId, currencyWallet, addNewToken, onAddToken }: Props) => {
  const styles = getStyles(useTheme())
  const [currencyCode, setCurrencyCode] = useState<string>('')
  const [currencyName, setCurrencyName] = useState<string>('')
  const [contractAddress, setContractAddress] = useState<string>('')
  const [decimalPlaces, setDecimalPlaces] = useState<string>('')

  const [currencyCodeError, setCurrencyCodeError] = useState<string>('')

  const [currencyCodeReturnKeyType, setCurrencyCodeReturnKeyType] = useState<ReturnKeyType>('next')
  const [currencyNameReturnKeyType, setCurrencyNameReturnKeyType] = useState<ReturnKeyType>('next')
  const [contractAddressReturnKeyType, setContractAddressReturnKeyType] = useState<ReturnKeyType>('next')
  const [decimalPlacesReturnKeyType, setDecimalPlacesReturnKeyType] = useState<ReturnKeyType>('next')

  const currencyCodeInputRef = useRef<TextInput>()
  const currencyNameInputRef = useRef<TextInput>()
  const contractAddressInputRef = useRef<TextInput>()
  const decimalPlacesInputRef = useRef<TextInput>()

  const handleSubmit = async () => {
    if (currencyCodeError) return

    const currentCustomTokenIndex = currentCustomTokens.findIndex(item => item.currencyCode === currencyCode)
    const metaTokensIndex = wallet.metaTokens.findIndex(item => item.currencyCode === currencyCode)

    // if token is hard-coded into wallets of this type
    if (metaTokensIndex >= 0) showError(s.strings.manage_tokens_duplicate_currency_code)

    // if that token already exists and is visible (ie not deleted)
    if (currentCustomTokenIndex >= 0 && currentCustomTokens[currentCustomTokenIndex].isVisible) {
      showError(s.strings.manage_tokens_duplicate_currency_code)
    } else if (currencyName && currencyCode && decimalPlaces && contractAddress) {
      try {
        await currencyWallet.parseUri(contractAddress, currencyCode)
      } catch (parseError) {
        showError(parseError)
        return
      }

      const denomination = decimalPlacesToDenomination(decimalPlaces)

      const isExists = currencyInfos.some(
        (item: any) =>
          item.currencyCode === currencyCode ||
          item.currencyName === currencyName ||
          item.decimalPlaces === decimalPlaces ||
          item.contractAddress === contractAddress
      )

      if (!isExists) {
        const isConfirm = await Airship.show(bridge => <MismatchTokenParamsModal bridge={bridge} />)

        if (!isConfirm) return
      }

      addNewToken(walletId, currencyName, currencyCode.toUpperCase(), contractAddress, denomination, wallet.type)
      onAddToken(currencyCode.toUpperCase())
    } else {
      showError(s.strings.addtoken_invalid_information)
    }
  }

  const handleSubmitEditing = async () => {
    const data = [currencyCode, currencyName, contractAddress, decimalPlaces]
    const inputRefs = [currencyCodeInputRef, currencyNameInputRef, contractAddressInputRef, decimalPlacesInputRef]
    const dataEmptyIndex = data.findIndex(item => item === '')

    if (dataEmptyIndex === -1) {
      handleSubmit()
    } else {
      const currencyInfo = currencyInfos.find(
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

      const nextFocusedField = inputRefs[dataEmptyIndex].current

      if (nextFocusedField !== null) nextFocusedField.focus()
    }
  }

  useReturnKeyType([currencyCode, currencyName, contractAddress, decimalPlaces], (returnKeyTypes: ReturnKeyType[]) => {
    setCurrencyCodeReturnKeyType(returnKeyTypes[0])
    setCurrencyNameReturnKeyType(returnKeyTypes[1])
    setContractAddressReturnKeyType(returnKeyTypes[2])
    setDecimalPlacesReturnKeyType(returnKeyTypes[3])
  })

  const handleChangeCurrencyCode = (value: string) => {
    setCurrencyCode(value)
    setCurrencyCodeError(currencyCodeValidation(value))
  }

  return (
    <SceneWrapper avoidKeyboard background="theme">
      <SceneHeader title={s.strings.title_add_token} style={styles.header} bold />
      <ScrollView style={styles.container}>
        <EdgeTextFieldOutlined
          ref={currencyCodeInputRef}
          autoFocus
          onChangeText={handleChangeCurrencyCode}
          value={currencyCode}
          autoCapitalize="characters"
          returnKeyType={currencyCodeReturnKeyType}
          label={s.strings.addtoken_currency_code_input_text}
          maxLength={MAX_TOKEN_CODE_CHARACTERS}
          error={currencyCodeError}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={currencyNameInputRef}
          onChangeText={setCurrencyName}
          value={currencyName}
          autoCapitalize="words"
          returnKeyType={currencyNameReturnKeyType}
          label={s.strings.addtoken_name_input_text}
          maxLength={CURRENCY_NAME_MAX_LENGTH}
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
          maxLength={CONTRACT_ADDRESS_MAX_LENGTH}
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 1]}
          onSubmitEditing={handleSubmitEditing}
        />
        <EdgeTextFieldOutlined
          ref={decimalPlacesInputRef}
          onChangeText={setDecimalPlaces}
          value={decimalPlaces}
          returnKeyType={decimalPlacesReturnKeyType}
          label={s.strings.addtoken_denomination_input_text}
          maxLength={DECIMAL_PLACES_MAX_LENGTH}
          keyboardType="numeric"
          showSearchIcon={false}
          autoCorrect={false}
          marginRem={[0.5, 0.6, 0]}
          onSubmitEditing={handleSubmitEditing}
        />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
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
    currencyInfos: [] // TODO: replace it with real data when it will be available
  }),
  dispatch => ({
    addNewToken(walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) {
      dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
    }
  })
)(AddToken)
