// @flow
import { createInputModal, showModal } from 'edge-components'
import React, { Component } from 'react'
import { FlatList, Image, Text, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { PLUGIN_BUY, PLUGIN_BUY_LEGACY, PLUGIN_SPEND, PLUGIN_SPEND_LEGACY, SPEND } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { buySellPlugins, spendPlugins } from '../../modules/UI/scenes/Plugins/plugins'
import styles from '../../styles/scenes/PluginsStyle.js'
import { THEME, colors } from '../../theme/variables/airbitz.js'
import type { BuySellPlugin } from '../../types'

type Props = {
  developerModeOn: boolean
}

type State = {
  data: Array<Object>
}

class PluginList extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      data: []
    }
  }

  _onPress = (plugin: BuySellPlugin) => {
    if (plugin.pluginId === 'custom') {
      const yesButton = {
        title: s.strings.load_plugin
      }
      const noButton = {
        title: s.strings.string_cancel_cap
      }
      const input = {
        label: s.strings.plugin_url,
        autoCorrect: false,
        returnKeyType: 'go',
        initialValue: '',
        autoFocus: true
      }
      const modal = createInputModal({
        icon: (
          <IonIcon
            name="md-globe"
            size={42}
            color={colors.primary}
            style={[
              {
                backgroundColor: THEME.COLORS.TRANSPARENT,
                zIndex: 1015,
                elevation: 1015
              }
            ]}
          />
        ),
        title: s.strings.load_plugin,
        input,
        yesButton,
        noButton
      })
      showModal(modal).then(response => {
        if (response) {
          plugin.sourceFile = { uri: response }
        }
        const key = Actions.currentScene === SPEND ? PLUGIN_SPEND : PLUGIN_BUY
        Actions[key]({ plugin: plugin })
      })
      return
    }
    if (plugin.isLegacy) {
      console.log('pluginStuff: legacy')
    }
    if (Actions.currentScene === SPEND) {
      const key = plugin.isLegacy ? PLUGIN_SPEND_LEGACY : PLUGIN_SPEND
      Actions[key]({ plugin: plugin })
      return
    }
    const key = plugin.isLegacy ? PLUGIN_BUY_LEGACY : PLUGIN_BUY
    Actions[key]({ plugin: plugin })
  }

  _renderPlugin = ({ item }) => (
    <TouchableWithoutFeedback onPress={() => this._onPress(item)}>
      <View style={styles.pluginRow}>
        <View style={styles.pluginBox}>
          <View style={styles.pluginLeft}>
            <View style={styles.logoWrap}>
              <View style={[styles.logo]}>{item.imageUrl && <Image style={{ height: '100%' }} source={{ uri: item.imageUrl }} />}</View>
            </View>
            <View style={styles.textBoxWrap}>
              <Text style={styles.titleBox}>{item.name}</Text>
              <Text style={styles.subtitleBox}>{item.subtitle}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )

  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <FlatList data={this.state.data} renderItem={this._renderPlugin} keyExtractor={item => item.name} />
        </View>
      </SafeAreaView>
    )
  }
}

class PluginBuySellComponent extends PluginList {
  componentDidMount () {
    console.log('pl: ', this.props.developerModeOn)
    this.setState({
      data: buySellPlugins(this.props.developerModeOn)
    })
  }
}

class PluginSpendComponent extends PluginList {
  componentDidMount () {
    this.setState({
      data: spendPlugins(this.props.developerModeOn)
    })
  }
}

const listMapStateToProps = state => {
  const developerModeOn = state.ui.settings.developerModeOn
  return {
    developerModeOn
  }
}

const listMapDispatchToProps = dispatch => ({})

const PluginBuySell = connect(
  listMapStateToProps,
  listMapDispatchToProps
)(PluginBuySellComponent)

const PluginSpend = connect(
  listMapStateToProps,
  listMapDispatchToProps
)(PluginSpendComponent)

export { PluginBuySell, PluginSpend }
