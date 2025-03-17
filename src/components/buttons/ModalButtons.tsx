/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */

import * as React from 'react'

import { ButtonsView, ButtonsViewProps } from './ButtonsView'

interface Props extends Omit<Omit<ButtonsViewProps, 'parentType'>, 'layout'> {}

export const ModalButtons = (props: Props) => {
  return <ButtonsView {...props} layout="column" parentType="modal" />
}
