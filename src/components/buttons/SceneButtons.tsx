// TODO: Replace <ButtonsViewUi4 parentType="scene" .../> with this, fully refactor
// scene layout handling out of ButtonsViewUi4

import * as React from 'react'

import { ButtonsView, ButtonsViewProps } from './ButtonsView'

interface Props extends Omit<Omit<ButtonsViewProps, 'parentType'>, 'layout'> {}

export const SceneButtons = (props: Props) => {
  return <ButtonsView {...props} parentType="scene" />
}
