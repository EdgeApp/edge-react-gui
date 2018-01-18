// @flow

import React, {Component} from 'react'

import {TextInput} from 'react-native'

import StylizedModal from '../../../components/Modal/Modal.ui'

type Props = {}
type State = {}
export class CustomFeesModal extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    return <StylizedModal />
  }
}
