// TODO: Replace <ButtonsViewUi4 parentType="scene" .../> with this, fully refactor
// scene layout handling out of ButtonsViewUi4

import * as React from 'react'

import { ButtonsView, ButtonsViewProps } from './ButtonsView'

interface Props extends Omit<Omit<ButtonsViewProps, 'parentType'>, 'layout'> {}

/** For properly spacing out content behind floating absolute buttons */
export const SCENE_BUTTONS_MARGIN_REM = 7

export const SceneButtons = (props: Props) => {
  return <ButtonsView {...props} parentType="scene" />
}
