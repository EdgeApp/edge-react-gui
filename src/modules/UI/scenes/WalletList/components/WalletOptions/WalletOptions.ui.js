// @flow

import React, {Component} from 'react'
import {View} from 'react-native'

import DeleteModal from '../DeleteModal/DeleteModalConnector'
import RenameModal from '../RenameModal/RenameModalConnector'
import ResyncModal from '../ResyncModal/ResyncModalConnector'
import SplitModal from '../SplitModal/SplitModalConnector'
import GetSeedModal from '../GetSeedModal/GetSeedModalConnector'

type Props = any
type State = any

export default class WalletOptions extends Component<Props, State> {
  render () {
    return <View>
      <DeleteModal />
      <RenameModal />
      <ResyncModal />
      <SplitModal />
      <GetSeedModal />
    </View>
  }
}
