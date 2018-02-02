// @flow

import type {State} from '../../../ReduxTypes'

export const getView = (state: State) => {
  return state.ui.scenes.ABAlert.view
}

export const getTitle = (state: State) => {
  return state.ui.scenes.ABAlert.syntax.title
}

export const getMessage = (state: State) => {
  return state.ui.scenes.ABAlert.syntax.message
}

export const getButtons = (state: State) => {
  return state.ui.scenes.ABAlert.syntax.buttons
}

export const getRoute = (state: State) => {
  return state.ui.scenes.ABAlert.route
}
