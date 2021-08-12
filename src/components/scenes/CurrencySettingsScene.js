// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, Text } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { disableCustomNodes, enableCustomNodes, saveCustomNodesList, setDenominationKeyRequest } from '../../actions/SettingsActions.js'
import { CURRENCY_SETTINGS_SELECT_FIAT, SPENDING_LIMITS } from '../../constants/SceneKeys'
import s from '../../locales/strings.js'
import { getDenominations, getDisplayDenominationKey } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes'
import type { GuiDenomination, GuiFiatType } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SetCustomNodesModal } from '../modals/SetCustomNodesModal.ui.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsRow } from '../themed/SettingsRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
type NavigationProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  currencyInfo: EdgeCurrencyInfo
}
type StateProps = {
  denominations: GuiDenomination[],
  selectedDenominationKey: string,
  electrumServers: string[],
  disableFetchingServers: boolean,
  defaultElectrumServer: string,
  currencyCode: string
}
type DispatchProps = {
  disableCustomNodes: () => void,
  enableCustomNodes: () => void,
  saveCustomNodesList: (nodes: string[]) => void,
  selectDenomination: (denominationKey: string) => void
}
type Props = NavigationProps & StateProps & DispatchProps & ThemeProps

type State = {
  isSetCustomNodesModalVisible: boolean,
  activatedBy: string | null
}

export class CurrencySettingsComponent extends React.Component<Props, State> {
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

  selectFiatNextHandler = (isValidFiatType: boolean, selectedFiat: GuiFiatType) => {
    Actions.push(SPENDING_LIMITS, {
      currencyCode: this.props.currencyCode,
      fiatCurrencyCode: selectedFiat.value
    })
  }

  handleSetSpendingLimit = () => {
    Actions.push(CURRENCY_SETTINGS_SELECT_FIAT, {
      onNext: this.selectFiatNextHandler
    })
  }

  render() {
    const { theme } = this.props

    const rightArrow = <AntDesignIcon color={theme.icon} name="right" size={theme.rem(1)} />

    return (
      <SceneWrapper background="theme" hasTabs={false}>
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
          <SettingsHeaderRow text={s.strings.settings_denominations_title} />
          {this.props.denominations.map(denomination => {
            const key = denomination.multiplier
            const left = (
              <Text style={{ fontFamily: theme.fontFaceDefault, fontSize: theme.rem(1), textAlign: 'left', flexShrink: 1, color: theme.primaryText }}>
                <Text style={{ fontFamily: theme.fontFaceSymbols }}>{denomination.symbol}</Text>
                {' - ' + denomination.name}
              </Text>
            )
            const isSelected = key === this.props.selectedDenominationKey
            const onPress = this.selectDenomination(key)
            return <SettingsRadioRow key={denomination.multiplier} icon={left} text="" value={isSelected} onPress={onPress} />
          })}
          {this.props.defaultElectrumServer.length !== 0 && (
            <>
              <SettingsHeaderRow text={s.strings.settings_custom_nodes_title} />
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
          <>
            <SettingsHeaderRow text={s.strings.spending_limits} />
            <SettingsRow text={s.strings.spending_limits_tx_title} right={rightArrow} onPress={this.handleSetSpendingLimit} />
          </>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export const CurrencySettingsScene = connect<StateProps, DispatchProps, NavigationProps>(
  (state, ownProps) => {
    const { currencyInfo } = ownProps
    const { currencyCode, defaultSettings, pluginId } = currencyInfo

    const { account } = state.core
    const defaultElectrumServer = defaultSettings.electrumServers ? defaultSettings.electrumServers[0] : ''
    const userSettings = account.currencyConfig[pluginId].userSettings
    const electrumServers = userSettings ? userSettings.electrumServers : []
    const disableFetchingServers = userSettings ? userSettings.disableFetchingServers : false
    return {
      denominations: getDenominations(state, currencyCode),
      selectedDenominationKey: getDisplayDenominationKey(state, currencyCode),
      electrumServers,
      disableFetchingServers,
      defaultElectrumServer,
      currencyCode
    }
  },
  (dispatch, ownProps) => ({
    disableCustomNodes() {
      dispatch(disableCustomNodes(ownProps.currencyInfo.currencyCode))
    },
    enableCustomNodes() {
      dispatch(enableCustomNodes(ownProps.currencyInfo.currencyCode))
    },
    selectDenomination(denominationKey) {
      dispatch(setDenominationKeyRequest(ownProps.currencyInfo.currencyCode, denominationKey))
    },
    saveCustomNodesList(nodesList: string[]) {
      dispatch(saveCustomNodesList(ownProps.currencyInfo.currencyCode, nodesList))
    }
  })
)(withTheme(CurrencySettingsComponent))
