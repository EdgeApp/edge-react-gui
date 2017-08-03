import * as ACTION from './action'

const initialState = {
  transaction: {},
  parsedURI: {},

  displayAmount: 0,
  publicAddress: '',
  feeSatoshi: 0,
  label: '',

  inputCurrencySelected: 'fiat',
  maxSatoshi: 0,
  isPinEnabled: false,
  isSliderLocked: false,
  draftStatus: 'under',
  isKeyboardVisible: false,
  pending: false,
  mode: null
}

const sendConfirmation = (state = initialState, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION:
      const transaction = data.transaction
      const networkFee = transaction.networkFee
      return {
        ...state,
        transaction,
        networkFee
      }
    case ACTION.UPDATE_PARSED_URI:
      const { parsedURI = {} } = data
      const publicAddress = parsedURI.publicAddress
      return {
        ...state,
        parsedURI,
        publicAddress
      }
    case ACTION.UPDATE_DISPLAY_AMOUNT:
      const { displayAmount } = data
      return {
        ...state,
        displayAmount
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
        maxSatoshi
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
