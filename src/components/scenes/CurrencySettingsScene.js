// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, Text } from 'react-native'
import { connect } from 'react-redux'

import { disableCustomNodes, enableCustomNodes, saveCustomNodesList, setDenominationKeyRequest } from '../../actions/SettingsActions.js'
import s from '../../locales/strings.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import { dayText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import type { GuiDenomination } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsRadioRow } from '../common/SettingsRadioRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { SetCustomNodesModal } from '../modals/SetCustomNodesModal.ui.js'

const SETTINGS_DENOMINATION_TEXT = s.strings.settings_denominations_title
const CUSTOM_NODES_TEXT = s.strings.settings_custom_nodes_title

type NavigationProps = {
  currencyInfo: EdgeCurrencyInfo
}
type StateProps = {
  denominations: Array<GuiDenomination>,
  selectedDenominationKey: string,
  electrumServers: Array<string>,
  disableFetchingServers: boolean,
  defaultElectrumServer: string
}
type DispatchProps = {
  disableCustomNodes(): void,
  enableCustomNodes(): void,
  saveCustomNodesList(nodes: Array<string>): void,
  selectDenomination(string): void
}
type Props = NavigationProps & StateProps & DispatchProps

type State = {
  isSetCustomNodesModalVisible: boolean,
  activatedBy: string | null
}

export class CurrencySettingsComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isSetCustomNodesModalVisible: false,
      activatedBy: null
    }
  }

  selectDenomination = (key: string) => () => {
    return this.props.selectDenomination(key)
  }

  closeSetCustomNodesModal = (callback: () => mixed) => {
    this.setState(
      {
        isSetCustomNodesModalVisible: false
      },
      callback
    )
  }

  openSetCustomNodesModal = (activatedBy: string) => {
    this.setState({
      isSetCustomNodesModalVisible: true,
      activatedBy
    })
  }

  enableSetCustomNodes = () => {
    this.props.enableCustomNodes()
  }

  disableSetCustomNodes = () => {
    this.props.disableCustomNodes()
  }

  onChangeEnableCustomNodes = () => {
    if (!this.props.disableFetchingServers) {
      this.setState(
        {
          isSetCustomNodesModalVisible: true
        },
        this.enableSetCustomNodes
      )
      this.openSetCustomNodesModal('switch')
    } else {
      this.disableSetCustomNodes()
    }
  }

  render() {
    return (
      <SceneWrapper background="body" hasTabs={false}>
        <ScrollView>
          {this.props.defaultElectrumServer.length !== 0 && (
            <SetCustomNodesModal
              isActive={this.state.isSetCustomNodesModalVisible}
              onExit={this.closeSetCustomNodesModal}
              electrumServers={this.props.electrumServers}
              saveCustomNodesList={this.props.saveCustomNodesList}
              defaultElectrumServer={this.props.defaultElectrumServer}
              disableCustomNodes={this.props.disableCustomNodes}
              activatedBy={this.state.activatedBy}
            />
          )}
          <SettingsHeaderRow text={SETTINGS_DENOMINATION_TEXT} />
          {this.props.denominations.map(denomination => {
            const key = denomination.multiplier
            const left = (
              <Text style={{ ...dayText('row-left'), color: THEME.COLORS.GRAY_1 }}>
                <Text style={{ fontFamily: THEME.FONTS.SYMBOLS }}>{denomination.symbol}</Text> - {denomination.name}
              </Text>
            )
            const isSelected = key === this.props.selectedDenominationKey
            const onPress = this.selectDenomination(key)
            return <SettingsRadioRow key={denomination.multiplier} icon={left} text="" isSelected={isSelected} onPress={onPress} />
          })}
          {this.props.defaultElectrumServer.length !== 0 && (
            <>
              <SettingsHeaderRow text={CUSTOM_NODES_TEXT} />
              <SettingsSwitchRow
                text={s.strings.settings_enable_custom_nodes}
                value={this.props.disableFetchingServers}
                onPress={this.onChangeEnableCustomNodes}
              />
              <SettingsRow
                disabled={!this.props.disableFetchingServers}
                text={s.strings.settings_set_custom_nodes_modal_title}
                onPress={() => this.openSetCustomNodesModal('row')}
              />
            </>
          )}
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export const CurrencySettingsScene = connect(
  (state: ReduxState, ownProps: NavigationProps): StateProps => {
    const { currencyInfo } = ownProps
    const { currencyCode, defaultSettings, pluginId } = currencyInfo

    const { account } = state.core
    const defaultElectrumServer = defaultSettings.electrumServers ? defaultSettings.electrumServers[0] : ''
    const userSettings = account.currencyConfig[pluginId].userSettings
    const electrumServers = userSettings ? userSettings.electrumServers : []
    const disableFetchingServers = userSettings ? userSettings.disableFetchingServers : false
    return {
      denominations: SETTINGS_SELECTORS.getDenominations(state, currencyCode),
      selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, currencyCode),
      electrumServers,
      disableFetchingServers,
      defaultElectrumServer
    }
  },
  (dispatch: Dispatch, ownProps: NavigationProps): DispatchProps => ({
    disableCustomNodes() {
      dispatch(disableCustomNodes(ownProps.currencyInfo.currencyCode))
    },
    enableCustomNodes() {
      dispatch(enableCustomNodes(ownProps.currencyInfo.currencyCode))
    },
    selectDenomination(denominationKey) {
      dispatch(setDenominationKeyRequest(ownProps.currencyInfo.currencyCode, denominationKey))
    },
    saveCustomNodesList(nodesList: Array<string>) {
      dispatch(saveCustomNodesList(ownProps.currencyInfo.currencyCode, nodesList))
    }
  })
)(CurrencySettingsComponent)
