// @flow

import React, { Component } from 'react'
import { View, TextInput, ActivityIndicator } from 'react-native'
import s from '../../../../../locales/strings.js'
import Text from '../../../components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../../components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { Icon } from '../../../components/Icon/Icon.ui.js'
import { PrimaryButton, SecondaryButton } from '../../../components/Modals/components'
import * as Constants from '../../../../../constants/indexConstants.js'
import styles, {styles as rawStyle} from './styles.js'

export type SetCustomNodesModalOwnProps = {
  isActive: boolean,
  onExit: () => void,
  customNodesList: Array<string>,
  saveCustomNodesList: (Array<string>) => void
}

export type SetCustomNodesModalState = {
  readableCustomNodesList: string
}

export type SetCustomNodeModalProps = SetCustomNodesModalOwnProps

export class SetCustomNodesModal extends Component<SetCustomNodeModalProps, SetCustomNodesModalState > {
  constructor (props: SetCustomNodeModalProps) {
    super(props)
    const readableCustomNodesList = this.props.customNodesList.join('\n')
    this.state = {
      readableCustomNodesList
    }
  }

  onChangeText = (input: string) => {
    this.setState({
      readableCustomNodesList: input
    })
  }

  handleSave = () => {
    if (this.state.readableCustomNodesList) {
      const parsedCustomNodesList = this.state.readableCustomNodesList.split('\n')
      const cleanedCustomNodesList = parsedCustomNodesList.map((item) => {
        // remove unwanted spaces
        return item.replace(' ', '')
      })
      this.props.saveCustomNodesList(cleanedCustomNodesList)
    } else {
      // if empty then pass an empty array otherwise it will save as [""] which is NOT falsy
      this.props.saveCustomNodesList([])
    }
  }

  render () {
    return (
      <InteractiveModal
        isActive={this.props.isActive}
      >
        <InteractiveModal.Icon>
          <Icon style={styles.txIDIcon} name={Constants.QUESTION_ICON} type={Constants.FONT_AWESOME} size={22} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.settings_set_custom_nodes_modal_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{textAlign: 'center'}}>{s.strings.settings_set_custom_nodes_modal_instructions}</InteractiveModal.Description>
          <View style={styles.customNodesInputWrap}>
            <TextInput
              style={styles.customNodesInput}
              value={this.state.readableCustomNodesList}
              onChangeText={this.onChangeText}
              editable={true}
              multiline
              placeholder={s.strings.settings_set_custom_nodes_placeholder}
              placeholderTextColor={rawStyle.placeholderText.color}
              underlineColorAndroid={rawStyle.placeholderUnderline.color}
              autoCorrect={false}
            />
          </View>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <View style={styles.buttonsWrap}>
            <PrimaryButton
              onPress={this.handleSave}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{this.props.isSetCustomNodesProcessing ? <ActivityIndicator /> : s.strings.string_save}</Text>
            </PrimaryButton>
            <SecondaryButton
              onPress={this.props.onExit}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>{s.strings.string_cancel_cap}</Text>
            </SecondaryButton>
          </View>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
