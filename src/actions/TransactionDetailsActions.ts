import { showError } from '../components/services/AirshipInstance'
import { getSyncedSubcategories, setSubcategoriesRequest } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'

export function getSubcategories(): ThunkAction<void> {
  return (dispatch, getState) => {
    const { account } = getState().core
    getSyncedSubcategories(account).then(s => {
      return dispatch({
        type: 'SET_TRANSACTION_SUBCATEGORIES',
        data: { subcategories: s }
      })
    })
  }
}

export function setNewSubcategory(newSubcategory: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const oldSubcats = state.ui.scenes.transactionDetails.subcategories
    const newSubcategories = [...oldSubcats, newSubcategory]
    return setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
      .then(() => {
        dispatch({
          type: 'SET_TRANSACTION_SUBCATEGORIES',
          data: { subcategories: newSubcategories.sort() }
        })
      })
      .catch(showError)
  }
}
