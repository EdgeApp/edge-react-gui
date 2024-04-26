// TODO: Replace <ButtonsViewUi4 parentType="modal" .../> with this

import * as React from 'react'

import { ButtonsViewUi4, ButtonsViewUi4Props } from '../ui4/ButtonsViewUi4'

interface Props extends Omit<Omit<ButtonsViewUi4Props, 'parentType'>, 'layout'> {}

export const ModalButtons = (props: Props) => {
  return <ButtonsViewUi4 {...props} layout="column" parentType="modal" />
}
