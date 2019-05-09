// @flow

import { LegacyPluginViewConnect, renderLegacyPluginBackButton } from '../../../../components/scenes/PluginViewLegacyScene.js'
import { PluginBuySell, PluginSpend } from '../../../../components/scenes/PluginViewListScene.js'
import { PluginViewConnect } from '../../../../components/scenes/PluginViewScene.js'
import { handlePluginBack, renderPluginBackButton } from './BackButton.js'

export {
  LegacyPluginViewConnect as LegacyPluginView,
  PluginBuySell,
  PluginSpend,
  PluginViewConnect as PluginView,
  handlePluginBack,
  renderLegacyPluginBackButton,
  renderPluginBackButton
}
