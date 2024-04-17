// TODO: Replace <ButtonsViewUi4 parentType="scene" .../> with this, fully refactor
// scene layout handling out of ButtonsViewUi4

import * as React from 'react'

import { ButtonsViewUi4, ButtonsViewUi4Props } from '../ui4/ButtonsViewUi4'

interface Props extends Omit<Omit<ButtonsViewUi4Props, 'parentType'>, 'layout'> {}

export const SceneButtons = (props: Props) => {
  return <ButtonsViewUi4 {...props} layout="column" parentType="scene" />
}
