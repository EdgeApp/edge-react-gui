// TODO: Replace <ButtonsViewUi4 parentType="modal" .../> with this

import * as React from 'react'

import { ButtonsView, ButtonsViewProps } from './ButtonsView'

interface Props extends Omit<Omit<ButtonsViewProps, 'parentType'>, 'layout'> {}

export const ModalButtons = (props: Props) => {
  return <ButtonsView {...props} layout="column" parentType="modal" />
}
