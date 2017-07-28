import * as ACTION from './action'

const initialState = {
  amountSatoshi: 0,
  fiatPerCrypto: 0,
  publicAddress: '',
  label: '',
  inputCurrencySelected: 'fiat',
  maxSatoshi: 0,
  isPinEnabled: false,
  isSliderLocked: false,
  draftStatus: 'under',
  isKeyboardVisible: false,
  feeSatoshi: 0,
  transaction: {},
  spendInfo: {},
  pending: false,
  mode: null
}

const sendConfirmation = (state = initialState, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_AMOUNT_SATOSHI:
      const { amountSatoshi } = data
      return {
        ...state,
        amountSatoshi
      }
    case ACTION.UPDATE_FIAT_PER_CRYPTO:
      const { fiatPerCrypto } = data
      return {
        ...state,
        fiatPerCrypto
      }
    case ACTION.UPDATE_PUBLIC_ADDRESS:
      const { publicAddress } = data
      return {
        ...state,
        publicAddress
      }
    case ACTION.UPDATE_LABEL:
      const { label } = data
      return {
        ...state,
        label
      }
    case ACTION.UPDATE_INPUT_CURRENCY_SELECTED:
      const { inputCurrencySelected } = data
      return {
        ...state,
        inputCurrencySelected
      }
    case ACTION.UPDATE_MAX_SATOSHI:
      const { maxSatoshi } = data
      return {
        ...state,
        maxSatoshi
      }
    case ACTION.USE_MAX_SATOSHI: {
      const { maxSatoshi } = data
      return {
        ...state,
        maxSatoshi,
        amountSatoshi: maxSatoshi
      }
    }
    case ACTION.UNLOCK_SLIDER:
      const { isSliderLocked } = data
      return {
        ...state,
        isSliderLocked
      }
    case ACTION.UPDATE_DRAFT_STATUS:
      const { draftStatus } = data
      return {
        ...state,
        draftStatus
      }
    case ACTION.UPDATE_IS_KEYBOARD_VISIBLE:
      const { isKeyboardVisible } = data
      return {
        ...state,
        isKeyboardVisible
      }
    case ACTION.UPDATE_FEE:
      const { feeSatoshi } = data
      return {
        ...state,
        feeSatoshi
      }
    case ACTION.UPDATE_TRANSACTION:
      const { transaction = {} } = data
      return {
        ...state,
        transaction
      }
    case ACTION.UPDATE_SPEND_INFO:
      const { spendInfo = {} } = data
      return {
        ...state,
        spendInfo
      }
    case ACTION.UPDATE_SPEND_PENDING:
      const { pending } = data
      return {
        ...state,
        pending
      }
    case ACTION.UPDATE_SPEND_SUFFICIENT_FUNDS:
      const { mode } = data
      return {
        ...state,
        mode
      }
    case ACTION.RESET:
      return initialState

    default:
      return state
  }
}

export default sendConfirmation
