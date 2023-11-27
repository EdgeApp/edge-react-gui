interface SetText {
  type: 'MENU_SEARCH/SET_TEXT'
  data: string
}

interface SetIsSearching {
  type: 'MENU_SEARCH/SET_IS_SEARCHING'
  data: boolean
}

export type MenuSearchActions = SetText | SetIsSearching
