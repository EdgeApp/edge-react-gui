// @flow
import * as React from 'react'
import { Platform, StyleSheet, TextInput, View } from 'react-native'
import { isIPhoneX } from 'react-native-safe-area-view'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { noOp } from '../../util/utils.js'

export type SetCustomNodesModalOwnProps = {
  isActive: boolean,
  onExit: Function => mixed,
  electrumServers?: string[],
  saveCustomNodesList: (string[]) => void,
  defaultElectrumServer: string,
  disableCustomNodes: () => void,
  activatedBy: string | null
}

export type SetCustomNodesModalState = {
  readableNodesList: string
}

export type SetCustomNodeModalProps = SetCustomNodesModalOwnProps

export class SetCustomNodesModal extends React.Component<SetCustomNodeModalProps, SetCustomNodesModalState> {
  constructor(props: SetCustomNodeModalProps) {
    super(props)
    const { electrumServers } = this.props
    const readableNodesList = electrumServers ? electrumServers.join('\n') : ''
    this.state = {
      readableNodesList
    }
  }

  onChangeText = (input: string) => {
    this.setState({
      readableNodesList: input
    })
  }

  handleSave = () => {
    this.props.onExit(() => {
      if (this.state.readableNodesList) {
        const parsedNodesList = this.state.readableNodesList.split('\n')
        const cleanedNodesList = parsedNodesList.map(item => {
          // remove unwanted spaces
          return item.replace(' ', '')
        })
        this.props.saveCustomNodesList(cleanedNodesList)
      } else {
        // if empty then pass an empty array otherwise it will save as [""] which is NOT falsy
        this.props.disableCustomNodes()
      }
    })
  }

  onCancel = () => {
    if (this.props.activatedBy === 'row') {
      this.props.onExit(noOp)
    } else {
      // was opened via toggle
      this.props.onExit(this.props.disableCustomNodes)
    }
  }

  render() {
    return (
      <InteractiveModal legacy isActive={this.props.isActive}>
        <InteractiveModal.Icon>
          <MaterialCommunityIcons name="server" size={22} style={{ position: 'relative', top: 1 }} />
        </InteractiveModal.Icon>
        <InteractiveModal.Title>
          <Text>{s.strings.settings_set_custom_nodes_modal_title}</Text>
        </InteractiveModal.Title>
        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>{s.strings.settings_set_custom_nodes_modal_instructions}</InteractiveModal.Description>
          <View style={styles.customNodesInputWrap}>
            <TextInput
              style={styles.customNodesInput}
              value={this.state.readableNodesList}
              onChangeText={this.onChangeText}
              editable
              multiline
              placeholder={this.props.defaultElectrumServer}
              placeholderTextColor={THEME.COLORS.GRAY_2}
              underlineColorAndroid={THEME.COLORS.TRANSPARENT}
              autoCorrect={false}
            />
          </View>
        </InteractiveModal.Body>
        <InteractiveModal.Footer>
          <View style={styles.buttonsWrap}>
            <PrimaryButton onPress={this.handleSave} style={styles.primaryButton}>
              <PrimaryButton.Text style={styles.primaryButtonText}>{s.strings.string_save}</PrimaryButton.Text>
            </PrimaryButton>
            <SecondaryButton onPress={this.onCancel}>
              <SecondaryButton.Text style={styles.secondaryButtonText}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
            </SecondaryButton>
          </View>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}

const rawStyles = {
  customNodesInputWrap: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    height: PLATFORM.deviceHeight * 0.13 - (Platform.OS === 'android' ? 23 : 0) + (isIPhoneX ? 60 : 0),
    padding: 3
  },
  customNodesInput: {
    height: PLATFORM.deviceHeight * 0.13 - (Platform.OS === 'android' ? 23 : 0) + (isIPhoneX ? 60 : 0) - 8,
    color: THEME.COLORS.GRAY_1,
    fontSize: 15,
    fontFamily: THEME.FONTS.DEFAULT,
    paddingVertical: 0,
    textAlignVertical: 'top'
  },
  buttonsWrap: {
    flexDirection: 'column'
  },
  primaryButton: {
    marginBottom: 8
  },
  primaryButtonText: {
    color: THEME.COLORS.WHITE
  },
  secondaryButtonText: {
    color: THEME.COLORS.WHITE
  }
}

const styles: typeof rawStyles = StyleSheet.create(rawStyles)
