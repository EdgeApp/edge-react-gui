import { combineReducers } from 'redux'

import { Action } from '../types/reduxTypes'

export interface MenuSearchState {
  readonly isSearching: boolean
  readonly searchText: string
}

export const menuSearch = combineReducers<MenuSearchState, Action>({
  isSearching(state: boolean = false, action: Action) {
    if (action.type === 'MENU_SEARCH/SET_IS_SEARCHING') {
      return action.data
    }
    return state
  },
  searchText(state: string = '', action: Action) {
    if (action.type === 'MENU_SEARCH/SET_TEXT') {
      return action.data
    }
    return state
  }
})
