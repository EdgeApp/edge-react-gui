// @flow

import React, { Component } from 'react'
import Text from '../../../components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../../components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { Icon } from '../../../components/Icon/Icon.ui.js'
import * as Constants from '../../../../../constants/indexConstants.js'
import styles from '../style.js'

export type SetCustomNodesModalOwnProps = {
  isActive: boolean,
  onExit: () => void,
  customNodesList: Array<string>
}

export class SetCustomNodesModal extends Component<SetCustomNodesModalOwnProps> {
  handleClick = () => {
    console.log('do something')
  }

  render () {
    return (
      <InteractiveModal
        isActive={this.props.isActive}
        onBackButtonPress={this.props.onExit}
        onBackdropPress={this.props.onExit}
        onModalHide={this.props.onExit}
      >
        <InteractiveModal.Icon>
          <Icon style={styles.txIDIcon} name={Constants.QUESTION_ICON} type={Constants.FONT_AWESOME} size={22} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>Howdy</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{textAlign: 'center'}}>Test</InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <Text>Hi</Text>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
