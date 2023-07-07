import { showError } from '../components/services/AirshipInstance'
import { getSyncedSubcategories, setSubcategoriesRequest } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'

export function getSubcategories(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    const subcategories = await getSyncedSubcategories(account)
    dispatch({
      type: 'SET_TRANSACTION_SUBCATEGORIES',
      data: { subcategories }
    })
  }
}

export function setNewSubcategory(newSubcategory: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const oldSubcats = state.ui.subcategories
    const newSubcategories = [...oldSubcats, newSubcategory]
    return await setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
      .then(() => {
        dispatch({
          type: 'SET_TRANSACTION_SUBCATEGORIES',
          data: { subcategories: newSubcategories.sort() }
        })
      })
      .catch(showError)
  }
}
